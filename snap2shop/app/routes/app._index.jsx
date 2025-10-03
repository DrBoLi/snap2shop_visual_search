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
import "../styles/homepage.css";
import { authenticate } from "../shopify.server";
import logger from "../utils/logger.js";
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
    logger.error('Error loading dashboard data:', error);
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
      logger.debug(`Fetching analytics for timeframe: ${selectedTimeframe}`);
      const response = await fetch(`/api/analytics-dashboard-simple?timeframe=${selectedTimeframe}`);
      logger.debug('Analytics response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics({
          imageSearchVolume: data.imageSearchVolume,
          imageSearchClicks: data.imageSearchClicks,
          clickThroughRate: data.clickThroughRate,
        });
        setDailyMetrics(data.dailyMetrics || []);
        logger.debug('Analytics payload received', data);
      } else {
        const errorText = await response.text();
        logger.error('Failed to fetch analytics data:', response.status, errorText);
      }
    } catch (error) {
      logger.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  }, [setAnalytics, setDailyMetrics, setLoading]);

  // Initial fetch on mount
  useEffect(() => {
    fetchAnalytics(timeframe);
  }, []);

  // Polling effect for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalytics(timeframe);
    }, 5000); // Poll every 5 seconds

    return () => {
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
          <div className="hero-section hero-gradient-bg">
            {/* Animated background elements */}
            <div className="animated-blobs">
              <div className="blob blob-1"></div>
              <div className="blob blob-2"></div>
              <div className="blob blob-3"></div>
            </div>

            <div className="hero-content">
              {/* Logo */}
              <div className="hero-logo-container">
                <img
                  src="/snap2shop-logo-2.png"
                  alt="Snap2Shop Logo"
                  className="hero-logo"
                />
              </div>

              {/* Badge */}
              <div className="hero-badge">
                <span style={{ fontSize: '16px' }}>✨</span>
                <span>AI-Powered Visual Search</span>
              </div>

              {/* Heading */}
              <h2 className="hero-heading">
                Bring Visual Discovery to Your Storefront
              </h2>

              {/* Description */}
              <p className="hero-description">
                Snap2Shop helps shoppers find the right products faster with AI-powered visual search.
                Add visual search to your online store, tailor the search experience, and monitor performance
                with built-in analytics.
              </p>

              {/* Stats */}
              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="hero-stat-value">98%</div>
                  <div className="hero-stat-label">Accuracy</div>
                </div>
                <div className="hero-stat hero-stat-divider">
                  <div className="hero-stat-value">&lt;2s</div>
                  <div className="hero-stat-label">Search Time</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-value">24/7</div>
                  <div className="hero-stat-label">Support</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Box>

      <BlockStack gap="600">
        {/* Features Overview */}
        <div className="features-section">
          <div className="features-header">
            <div className="features-badge">
              ✨ Features
            </div>
            <Text as="h2" variant="heading2xl" alignment="center">
              Everything You Need to Succeed
            </Text>
            <Box paddingBlockStart="300">
              <Text as="p" variant="bodyLg" alignment="center" tone="subdued">
                Powerful features designed to increase conversions and delight your customers
              </Text>
            </Box>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <Card>
                <Box padding="500">
                  <div className="feature-icon gradient-purple-pink">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                      <circle cx="12" cy="13" r="3"></circle>
                    </svg>
                  </div>
                  <Text as="h3" variant="headingMd">Visual Search</Text>
                  <Box paddingBlockStart="200">
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Let customers snap photos to find products instantly. AI identifies items and suggests perfect matches.
                    </Text>
                  </Box>
                </Box>
              </Card>
            </div>

            <div className="feature-card">
              <Card>
                <Box padding="500">
                  <div className="feature-icon gradient-orange-pink">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                  </div>
                  <Text as="h3" variant="headingMd">Lightning Fast</Text>
                  <Box paddingBlockStart="200">
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Search results in under 2 seconds. Optimized for performance and user experience.
                    </Text>
                  </Box>
                </Box>
              </Card>
            </div>

            <div className="feature-card">
              <Card>
                <Box padding="500">
                  <div className="feature-icon gradient-pink-purple">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10"></line>
                      <line x1="12" y1="20" x2="12" y2="4"></line>
                      <line x1="6" y1="20" x2="6" y2="14"></line>
                    </svg>
                  </div>
                  <Text as="h3" variant="headingMd">Built-in Analytics</Text>
                  <Box paddingBlockStart="200">
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Track search patterns, popular products, and conversion rates with comprehensive dashboards.
                    </Text>
                  </Box>
                </Box>
              </Card>
            </div>

            <div className="feature-card">
              <Card>
                <Box padding="500">
                  <div className="feature-icon gradient-blue-purple">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                      <path d="M2 2l7.586 7.586"></path>
                      <circle cx="11" cy="11" r="2"></circle>
                    </svg>
                  </div>
                  <Text as="h3" variant="headingMd">Customizable UI</Text>
                  <Box paddingBlockStart="200">
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Match your brand perfectly with flexible theming and customization options.
                    </Text>
                  </Box>
                </Box>
              </Card>
            </div>

            <div className="feature-card">
              <Card>
                <Box padding="500">
                  <div className="feature-icon gradient-purple-blue">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <Text as="h3" variant="headingMd">Secure & Private</Text>
                  <Box paddingBlockStart="200">
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Enterprise-grade security with full GDPR compliance and data protection.
                    </Text>
                  </Box>
                </Box>
              </Card>
            </div>

            <div className="feature-card">
              <Card>
                <Box padding="500">
                  <div className="feature-icon gradient-pink-orange">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                      <line x1="12" y1="18" x2="12.01" y2="18"></line>
                    </svg>
                  </div>
                  <Text as="h3" variant="headingMd">Mobile Optimized</Text>
                  <Box paddingBlockStart="200">
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Perfect experience on any device. Responsive design that works everywhere.
                    </Text>
                  </Box>
                </Box>
              </Card>
            </div>
          </div>
        </div>

        {/* Product Synchronization Section */}
        <Card>
          <Box padding="500">
            <BlockStack gap="500">
              <div>
                <div className="step-badge">Step 1</div>
                <Text as="h2" variant="headingXl">
                  Product Sync
                </Text>
              </div>
              <Text as="p" variant="bodyMd">
                Sync your product catalog to enable visual search functionality.
                This will import your products and their images for processing.
              </Text>

              {/* Instructions Box */}
              <div className="instruction-box">
                <h4 className="instruction-title">Instructions</h4>
                <ul className="instruction-list">
                  <li className="instruction-item">
                    <span className="instruction-number">1.</span>
                    <span>Click "Start Sync" or "Retry Sync" to initiate the product synchronization process</span>
                  </li>
                  <li className="instruction-item">
                    <span className="instruction-number">2.</span>
                    <span>Monitor the sync status card for real-time progress updates</span>
                  </li>
                  <li className="instruction-item">
                    <span className="instruction-number">3.</span>
                    <span>Once complete, your products will be ready for visual search</span>
                  </li>
                </ul>
              </div>

              {isSyncing && (
                <BlockStack gap="300">
                  <Banner status="info">
                    <p>Syncing products... {syncStatus.progress} of {syncStatus.totalItems}</p>
                  </Banner>
                  <ProgressBar progress={progress} size="small" />
                </BlockStack>
              )}

              {isCompleted && syncStatus.lastSync && !hasError && (
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
                      {isSyncing ? "Syncing..." : "Start Sync"}
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
                  <div className="sync-status-card">
                    <Box padding="400">
                      <BlockStack gap="300">
                        <Text as="h3" variant="headingMd">
                          Sync Status
                        </Text>
                        <BlockStack gap="200">
                          <InlineStack align="space-between">
                            <Text as="span" variant="bodyMd">Status</Text>
                            <Text as="span" variant="bodyMd" fontWeight="semibold">
                              {syncStatus?.status || "Not started"}
                            </Text>
                          </InlineStack>
                          {(isSyncing || isCompleted) && (
                            <InlineStack align="space-between">
                              <Text as="span" variant="bodyMd">Progress</Text>
                              <Text as="span" variant="bodyMd" fontWeight="semibold">
                                {syncStatus?.progress || 0} / {syncStatus?.totalItems || 0}
                              </Text>
                            </InlineStack>
                          )}
                          {syncStatus?.lastSync && (
                            <InlineStack align="space-between">
                              <Text as="span" variant="bodyMd">Last Sync</Text>
                              <Text as="span" variant="bodyMd" fontWeight="semibold">
                                {new Date(syncStatus.lastSync).toLocaleDateString()}
                              </Text>
                            </InlineStack>
                          )}
                          {hasError && syncStatus?.errorMessage && (
                            <Box paddingBlockStart="200">
                              <Banner status="critical">
                                <p>{syncStatus.errorMessage}</p>
                              </Banner>
                            </Box>
                          )}
                        </BlockStack>
                      </BlockStack>
                    </Box>
                  </div>
                </Layout.Section>
              </Layout>

              <Divider />

              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">
                  What happens during sync?
                </Text>
                <ul className="sync-process-list">
                  <li className="sync-process-item">
                    <div className="sync-dot dot-purple-pink"></div>
                    <Text as="span" variant="bodyMd" tone="subdued">
                      Fetches all products from your store
                    </Text>
                  </li>
                  <li className="sync-process-item">
                    <div className="sync-dot dot-pink-orange"></div>
                    <Text as="span" variant="bodyMd" tone="subdued">
                      Downloads product images securely
                    </Text>
                  </li>
                  <li className="sync-process-item">
                    <div className="sync-dot dot-blue-purple"></div>
                    <Text as="span" variant="bodyMd" tone="subdued">
                      Stores metadata for search functionality
                    </Text>
                  </li>
                  <li className="sync-process-item">
                    <div className="sync-dot dot-orange-pink"></div>
                    <Text as="span" variant="bodyMd" tone="subdued">
                      Prepares data for visual search processing
                    </Text>
                  </li>
                </ul>
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
              <div>
                <div className="step-badge step-badge-blue">Step 2</div>
                <Text as="h2" variant="headingXl">
                  Data Analytics
                </Text>
              </div>
              <Text as="p" variant="bodyMd">
                Track visual search performance with real-time analytics. Monitor customer engagement,
                search patterns, and conversion metrics to optimize your product discovery experience.
              </Text>

              <InlineStack align="space-between" blockAlign="center">
                <Text as="h3" variant="headingMd">Performance Overview</Text>
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
        <div className="chart-container" style={{ height: 320 }}>
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

      <div className="chart-description">
        <Text as="p" variant="bodySm" tone="subdued">
          Customers performed {totals.imageSearchVolume.toLocaleString()} image searches and
          clicked {totals.imageSearchClicks.toLocaleString()} results in this period. The
          overall click-through rate was {totals.clickThroughRate.toFixed(1)}%.
        </Text>
      </div>
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
