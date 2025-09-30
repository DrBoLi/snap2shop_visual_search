import { useState, useEffect, useCallback, useMemo } from "react";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  Divider,
  List,
  Link,
  Banner,
  ProgressBar,
  Modal,
  TextContainer,
  Select,
  Tooltip,
  Icon,
  Spinner,
  Box,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { LineChart, PolarisVizProvider } from "@shopify/polaris-viz";
import "@shopify/polaris-viz/build/esm/styles.css";
import { authenticate } from "../shopify.server";
import {
  resolveDashboardShop,
  getDashboardMetrics,
} from "../services/dashboardAnalytics.server.js";

// Combined loader for sync status and analytics
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  let shop = session.shop;

  try {
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || 'last_month';

    const { shop: resolvedShop } = await resolveDashboardShop(shop);
    const metrics = await getDashboardMetrics(resolvedShop, timeframe);

    return json({
      analytics: metrics.summary,
      dailyMetrics: metrics.dailyMetrics,
      timeframe: metrics.timeframe,
      shop: resolvedShop,
    });
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    return json({
      analytics: {
        imageSearchVolume: 0,
        imageSearchClicks: 0,
        clickThroughRate: 0,
        timeframe: 'last_month'
      },
      dailyMetrics: [],
      timeframe: 'last_month'
    });
  }
};

const TIMEFRAME_OPTIONS = [
  { label: 'Last 7 days', value: 'last_7_days' },
  { label: 'Last month', value: 'last_month' },
  { label: 'Last 3 months', value: 'last_3_months' },
];
export default function Index() {
  const {
    analytics: initialAnalytics,
    dailyMetrics: initialDailyMetrics,
    timeframe: initialTimeframe,
  } = useLoaderData();
  const [syncStatus, setSyncStatus] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [dailyMetrics, setDailyMetrics] = useState(initialDailyMetrics || []);
  const [loading, setLoading] = useState(false);
  
  const statusFetcher = useFetcher();
  const syncFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const shopify = useAppBridge();

  // Poll sync status every 2 seconds when syncing
  useEffect(() => {
    const pollStatus = () => {
      statusFetcher.load("/api/sync-status");
    };

    pollStatus(); // Initial load

    const interval = setInterval(() => {
      if (syncStatus?.status === "syncing") {
        pollStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [syncStatus?.status]);

  // Update sync status when fetcher data changes
  useEffect(() => {
    if (statusFetcher.data) {
      setSyncStatus(statusFetcher.data);
    }
  }, [statusFetcher.data]);

  // Show toast messages
  useEffect(() => {
    if (syncFetcher.data?.success) {
      shopify.toast.show("Product sync started");
    }
    if (syncFetcher.data?.error) {
      shopify.toast.show("Sync failed: " + syncFetcher.data.error, { isError: true });
    }
    if (deleteFetcher.data?.success) {
      shopify.toast.show("All product data deleted");
      statusFetcher.load("/api/sync-status"); // Refresh status
    }
    if (deleteFetcher.data?.error) {
      shopify.toast.show("Delete failed: " + deleteFetcher.data.error, { isError: true });
    }
  }, [syncFetcher.data, deleteFetcher.data]);

  // Function to fetch analytics data
  const fetchAnalytics = useCallback(async (selectedTimeframe) => {
    setLoading(true);
    try {
      console.log(`🔄 Fetching analytics for timeframe: ${selectedTimeframe}`);
      const response = await fetch(`/api/analytics-dashboard-simple?timeframe=${selectedTimeframe}`);
      console.log(`📡 Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics({
          imageSearchVolume: data.imageSearchVolume,
          imageSearchClicks: data.imageSearchClicks,
          clickThroughRate: data.clickThroughRate,
        });
        setDailyMetrics(data.dailyMetrics || []);
        console.log('✅ Analytics updated:', data);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch analytics data:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, [setAnalytics, setDailyMetrics, setLoading]);

  // Initial fetch on mount
  useEffect(() => {
    console.log('🚀 Starting initial analytics fetch...');
    fetchAnalytics(timeframe);
  }, []);

  // Polling effect for real-time updates
  useEffect(() => {
    console.log('🔄 Setting up polling interval...');
    const interval = setInterval(() => {
      console.log('⏰ Polling analytics...');
      fetchAnalytics(timeframe);
    }, 5000); // Poll every 5 seconds

    return () => {
      console.log('🛑 Clearing polling interval...');
      clearInterval(interval);
    };
  }, [timeframe]); // Remove fetchAnalytics dependency to avoid constant recreation

  useEffect(() => {
    setAnalytics(initialAnalytics);
    setDailyMetrics(initialDailyMetrics || []);
  }, [initialAnalytics, initialDailyMetrics]);

  const handleTimeframeChange = (value) => {
    setTimeframe(value);
    fetchAnalytics(value);
  };

  const handleSync = () => {
    syncFetcher.submit({}, { method: "POST", action: "/api/sync-products" });
  };

  const handleDelete = () => {
    deleteFetcher.submit({}, { method: "DELETE", action: "/api/sync-products" });
    setShowDeleteModal(false);
  };

  const isSyncing = syncStatus?.status === "syncing";
  const hasError = syncStatus?.status === "error";
  const isCompleted = syncStatus?.status === "completed";
  const progress = syncStatus?.totalItems > 0 ? (syncStatus.progress / syncStatus.totalItems) * 100 : 0;

  return (
    <Page fullWidth>
      <TitleBar title="Snap2Shop Visual Search" />
      
      {/* Hero Banner Section */}
      <Box paddingBlockEnd="600">
        <Card>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '80px 40px',
            borderRadius: '8px',
            color: 'white',
            textAlign: 'center'
          }}>
            <Layout>
              <Layout.Section>
                <BlockStack gap="500" align="center">
                  <Box paddingBlockEnd="200">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                      <img 
                        src="/snap2shop-logo.jpg" 
                        alt="Snap2Shop Logo" 
                        style={{ 
                          height: '100px', 
                          width: 'auto',
                          borderRadius: '12px',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                        }} 
                      />
                      <Text as="h1" variant="heading2xl" alignment="center" style={{ color: 'white', margin: 0, fontSize: '3.5rem' }}>
                        Snap2Shop
                      </Text>
                    </div>
                  </Box>
                  <Text as="h2" variant="headingXl" alignment="center" style={{ color: 'white', fontSize: '2.8rem', fontWeight: '600' }}>
                    Bring visual discovery to your storefront
                  </Text>
                  <Text as="p" variant="bodyLg" alignment="center" style={{ color: 'rgba(255,255,255,0.9)', maxWidth: '800px', fontSize: '1.4rem', lineHeight: '1.7', margin: '0 auto' }}>
                    Snap2Shop helps shoppers find the right products faster with AI-powered visual search. Transform your customers' shopping experience with intelligent image recognition that connects them to exactly what they're looking for. 
                    Add visual search to your online store, tailor the search experience, and monitor 
                    performance with built-in analytics.
                  </Text>
                </BlockStack>
              </Layout.Section>
            </Layout>
          </div>
        </Card>
      </Box>

      <BlockStack gap="600">
        {/* Quick Features Overview */}
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="500">
                <BlockStack gap="500">
                  <Text as="h2" variant="headingXl">
                    What visual search unlocks
                  </Text>
                  <BlockStack gap="300">
                    <FeatureRow
                      heading="AI-powered image recognition"
                      copy="Snap2Shop matches shopper-uploaded images with your catalog to surface the closest product results."
                    />
                    <Divider />
                    <FeatureRow
                      heading="Faster merchandising"
                      copy="Highlight collections or hero products directly in the visual search modal to guide discovery."
                    />
                    <Divider />
                    <FeatureRow
                      heading="Actionable analytics"
                      copy="Track search volume, click rates, and search box engagement from the integrated dashboard."
                    />
                  </BlockStack>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Product Synchronization Section */}
        <Card>
          <Box padding="500">
            <BlockStack gap="500">
              <Text as="h2" variant="headingXl">
                Product Synchronization
              </Text>
              <Text as="p" variant="bodyMd">
                Sync your product catalog to enable visual search functionality. 
                This will import your products and their images for processing.
              </Text>

              {hasError && (
                <Banner status="critical">
                  <p>Sync failed: {syncStatus.errorMessage}</p>
                </Banner>
              )}

              {isSyncing && (
                <BlockStack gap="300">
                  <Banner status="info">
                    <p>Syncing products... {syncStatus.progress} of {syncStatus.totalItems}</p>
                  </Banner>
                  <ProgressBar progress={progress} size="small" />
                </BlockStack>
              )}

              {isCompleted && syncStatus.lastSync && (
                <Banner status="success">
                  <p>
                    Last sync completed on{" "}
                    {new Date(syncStatus.lastSync).toLocaleString()}.{" "}
                    Synced {syncStatus.totalItems} products.
                  </p>
                </Banner>
              )}

              <Layout>
                <Layout.Section>
                  <InlineStack gap="300">
                    <Button
                      variant="primary"
                      loading={isSyncing || syncFetcher.state === "submitting"}
                      disabled={isSyncing}
                      onClick={handleSync}
                    >
                      {isSyncing ? "Syncing..." : hasError ? "Retry Sync" : "Start Sync"}
                    </Button>

                    {(isCompleted || hasError) && (
                      <Button
                        variant="secondary"
                        disabled={isSyncing}
                        onClick={handleSync}
                      >
                        Refresh Sync
                      </Button>
                    )}
                  </InlineStack>
                </Layout.Section>
                <Layout.Section variant="oneThird">
                  <BlockStack gap="300">
                    <Text as="h3" variant="headingMd">
                      Sync Status
                    </Text>
                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">Status</Text>
                        <Text as="span" variant="bodyMd" fontWeight="semibold">
                          {syncStatus?.status || "Loading..."}
                        </Text>
                      </InlineStack>
                      <InlineStack align="space-between">
                        <Text as="span" variant="bodyMd">Progress</Text>
                        <Text as="span" variant="bodyMd" fontWeight="semibold">
                          {syncStatus?.progress || 0} / {syncStatus?.totalItems || 0}
                        </Text>
                      </InlineStack>
                      {syncStatus?.lastSync && (
                        <InlineStack align="space-between">
                          <Text as="span" variant="bodyMd">Last Sync</Text>
                          <Text as="span" variant="bodyMd" fontWeight="semibold">
                            {new Date(syncStatus.lastSync).toLocaleDateString()}
                          </Text>
                        </InlineStack>
                      )}
                    </BlockStack>
                  </BlockStack>
                </Layout.Section>
              </Layout>

              <Divider />

              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">
                  What happens during sync?
                </Text>
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd">
                    • Fetches all products from your store
                  </Text>
                  <Text as="p" variant="bodyMd">
                    • Downloads product images securely
                  </Text>
                  <Text as="p" variant="bodyMd">
                    • Stores metadata for search functionality
                  </Text>
                  <Text as="p" variant="bodyMd">
                    • Prepares data for visual search processing
                  </Text>
                </BlockStack>
              </BlockStack>

              <Divider />

              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">
                  Data Management
                </Text>
                <Text as="p" variant="bodyMd">
                  Remove all synced product data and images from the visual search system.
                  This action cannot be undone.
                </Text>

                <InlineStack gap="300">
                  <Button
                    variant="primary"
                    tone="critical"
                    disabled={isSyncing || deleteFetcher.state === "submitting"}
                    loading={deleteFetcher.state === "submitting"}
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Delete All Data
                  </Button>
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Box>
        </Card>

        {/* Analytics Dashboard Section */}
        <Card>
          <Box padding="500">
            <BlockStack gap="500">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h2" variant="headingXl">Analytics Dashboard</Text>
                <InlineStack gap="200" blockAlign="center">
                  <Button 
                    onClick={() => fetchAnalytics(timeframe)}
                    loading={loading}
                    size="slim"
                  >
                    Refresh
                  </Button>
                  {loading && <Spinner accessibilityLabel="Updating data" size="small" />}
                  <Select
                    label="Timeframe"
                    options={TIMEFRAME_OPTIONS}
                    value={timeframe}
                    onChange={handleTimeframeChange}
                  />
                </InlineStack>
              </InlineStack>

              <PerformanceCard
                analytics={analytics}
                dailyMetrics={dailyMetrics}
                loading={loading}
              />
            </BlockStack>
          </Box>
        </Card>

        {/* Delete Modal */}
        <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete All Product Data"
        primaryAction={{
          content: "Delete",
          onAction: handleDelete,
          destructive: true,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setShowDeleteModal(false),
          },
        ]}
      >
        <Modal.Section>
          <TextContainer>
            <p>
              This will permanently delete all synced product data, images, and 
              search indexes from the visual search system. You'll need to run 
              a full sync again to restore functionality.
            </p>
            <p>
              <strong>This action cannot be undone.</strong>
            </p>
          </TextContainer>
        </Modal.Section>
        </Modal>
      </BlockStack>
    </Page>
  );
}

function PerformanceCard({ analytics, dailyMetrics, loading }) {
  const totals = analytics || {
    imageSearchVolume: 0,
    imageSearchClicks: 0,
    clickThroughRate: 0,
  };

  const hasData = Array.isArray(dailyMetrics) && dailyMetrics.length > 0;
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const chartData = useMemo(() => {
    if (!hasData) return [];

    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const labelFor = (dateString) => {
      try {
        return dateFormatter.format(new Date(`${dateString}T00:00:00Z`));
      } catch (error) {
        return dateString;
      }
    };

    const searchesSeries = dailyMetrics.map(({ date, searches }) => ({
      key: labelFor(date),
      value: Number(searches ?? 0),
    }));

    const clicksSeries = dailyMetrics.map(({ date, clicks }) => ({
      key: labelFor(date),
      value: Number(clicks ?? 0),
    }));

    return [
      { name: 'Searches', data: searchesSeries },
      { name: 'Clicks', data: clicksSeries },
    ];
  }, [dailyMetrics, hasData]);

  return (
    <BlockStack gap="500">
      <InlineStack gap="500" wrap align="start">
        <SummaryMetric label="Total searches" value={totals.imageSearchVolume} />
        <SummaryMetric label="Total clicks" value={totals.imageSearchClicks} />
        <SummaryMetric
          label="Average CTR"
          value={totals.clickThroughRate}
          suffix="%"
          format={(val) => Number(val ?? 0).toFixed(1)}
        />
        {loading && (
          <InlineStack gap="200" blockAlign="center">
            <Spinner size="small" />
            <Text tone="subdued" variant="bodySm">
              Updating…
            </Text>
          </InlineStack>
        )}
      </InlineStack>

      {hasData ? (
        <div style={{ height: 320 }}>
          {isClient ? (
            <PolarisVizProvider animated>
              <LineChart
                data={chartData}
                theme="Default"
                isAnimated
                showLegend
                legendPosition="bottom"
                xAxisOptions={{ labelFormatter: (value) => value }}
                yAxisOptions={{
                  labelFormatter: (value) => Number(value).toLocaleString(),
                }}
              />
            </PolarisVizProvider>
          ) : (
            <BlockStack gap="150" align="center">
              <Spinner size="small" />
              <Text tone="subdued" variant="bodySm">
                Preparing chart…
              </Text>
            </BlockStack>
          )}
        </div>
      ) : (
        <Text tone="subdued" variant="bodyMd">
          No activity recorded for this timeframe yet.
        </Text>
      )}

      <Text tone="subdued" variant="bodySm">
        Customers performed {totals.imageSearchVolume.toLocaleString()} image searches and
        clicked {totals.imageSearchClicks.toLocaleString()} results in this period. The
        overall click-through rate was {totals.clickThroughRate.toFixed(1)}%.
      </Text>
    </BlockStack>
  );
}

function SummaryMetric({ label, value, suffix, format }) {
  const formattedValue = format
    ? format(value)
    : Number(value ?? 0).toLocaleString();

  return (
    <BlockStack gap="150">
      <Text tone="subdued" variant="bodySm">
        {label}
      </Text>
      <InlineStack gap="100" blockAlign="center">
        <Text as="span" variant="headingXl">
          {formattedValue}
        </Text>
        {suffix ? (
          <Text as="span" variant="bodyMd" tone="subdued">
            {suffix}
          </Text>
        ) : null}
      </InlineStack>
    </BlockStack>
  );
}

function FeatureRow({ heading, copy }) {
  return (
    <BlockStack gap="100">
      <Text as="h3" variant="headingSm">
        {heading}
      </Text>
      <Text as="p" variant="bodyMd">
        {copy}
      </Text>
    </BlockStack>
  );
}
