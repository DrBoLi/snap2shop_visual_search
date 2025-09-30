import { useState, useEffect, useCallback, useMemo } from "react";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { json } from "@remix-run/node";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  InlineStack,
  Select,
  Tooltip,
  Icon,
  Spinner,
  Button,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { InfoIcon } from "@shopify/polaris-icons";
import { LineChart, PolarisVizProvider } from "@shopify/polaris-viz";
import "@shopify/polaris-viz/build/esm/styles.css";
import { authenticate } from "../shopify.server";
import {
  resolveDashboardShop,
  getDashboardMetrics,
} from "../services/dashboardAnalytics.server.js";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  let shop = session.shop;

  try {
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || 'last_month';

    const { shop: resolvedShop, availableShops } = await resolveDashboardShop(shop);
    if (resolvedShop !== shop) {
      console.log(`⚠️ Using fallback shop: ${resolvedShop}`);
    }

    const metrics = await getDashboardMetrics(resolvedShop, timeframe);
    console.log(`📊 Dashboard data for ${resolvedShop}:`, metrics.summary);

    return json({
      analytics: metrics.summary,
      dailyMetrics: metrics.dailyMetrics,
      timeframe: metrics.timeframe,
      shop: resolvedShop,
      availableShops,
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    return json({ 
      analytics: { 
        imageSearchVolume: 0, 
        imageSearchClicks: 0, 
        clickThroughRate: 0 
      },
      dailyMetrics: [],
      timeframe: 'last_month'
    });
  }
};

const TIMEFRAME_OPTIONS = [
  { label: "Last 7 days", value: "last_7_days" },
  { label: "Last month", value: "last_month" },
  { label: "Last 3 months", value: "last_3_months" },
];

export default function Dashboard() {
  const {
    analytics: initialAnalytics,
    dailyMetrics: initialDailyMetrics,
    timeframe: initialTimeframe,
  } = useLoaderData();
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [dailyMetrics, setDailyMetrics] = useState(initialDailyMetrics);
  const [loading, setLoading] = useState(false);

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
  }, []);

  // Polling effect for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalytics(timeframe);
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [timeframe, fetchAnalytics]);

  useEffect(() => {
    setAnalytics(initialAnalytics);
    setDailyMetrics(initialDailyMetrics);
  }, [initialAnalytics, initialDailyMetrics]);

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
    const url = new URL(window.location);
    url.searchParams.set('timeframe', newTimeframe);
    navigate(url.pathname + url.search);
    fetchAnalytics(newTimeframe);
  };

  return (
    <Page fullWidth>
      <TitleBar title="Visual Search Analytics" />
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="h1" variant="headingLg">Analytics Dashboard</Text>
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

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <InlineStack gap="200" blockAlign="center">
                  <Text as="h2" variant="headingMd">Daily Performance</Text>
                  <Tooltip content="Image search volume and clicks per day within the selected timeframe">
                    <Icon source={InfoIcon} tone="subdued" />
                  </Tooltip>
                </InlineStack>
                <PerformanceChart
                  dailyMetrics={dailyMetrics}
                  analytics={analytics}
                  loading={loading}
                  timeframe={timeframe}
                />
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}

function PerformanceChart({ dailyMetrics, analytics, loading, timeframe }) {
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
      {
        name: 'Searches',
        data: searchesSeries,
      },
      {
        name: 'Clicks',
        data: clicksSeries,
      },
    ];
  }, [dailyMetrics, hasData]);

  if (!hasData) {
    return (
      <Text tone="subdued" variant="bodyMd">
        No activity recorded for this timeframe yet.
      </Text>
    );
  }

  return (
    <BlockStack gap="400">
      <InlineStack gap="400" wrap align="start">
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

      <div style={{ height: 320 }}>
        {isClient ? (
          <PolarisVizProvider animated>
            <LineChart
              data={chartData}
              theme="Default"
              isAnimated
              xAxisOptions={{ labelFormatter: (value) => value }}
              yAxisOptions={{
                labelFormatter: (value) => Number(value).toLocaleString(),
              }}
              showLegend
              legendPosition="bottom"
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
      <Text as="span" variant="headingLg">
        {formattedValue}
        {suffix ? suffix : null}
      </Text>
    </BlockStack>
  );
}
