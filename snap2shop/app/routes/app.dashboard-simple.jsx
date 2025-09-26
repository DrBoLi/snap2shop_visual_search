import { useState, useEffect } from "react";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
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
  Badge,
  Spinner,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { InfoIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  try {
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || 'last_month';
    
    const response = await fetch(`${url.origin}/api/analytics-dashboard-simple?timeframe=${timeframe}`, {
      headers: { 'Cookie': request.headers.get('Cookie') || '' }
    });
    
    const analytics = await response.json();
    return json({ analytics, timeframe });
  } catch (error) {
    console.error('Error loading simplified dashboard:', error);
    return json({ 
      analytics: { 
        imageSearchVolume: 0, 
        imageSearchClicks: 0, 
        clickThroughRate: 0 
      },
      timeframe: 'last_month'
    });
  }
};

const TIMEFRAME_OPTIONS = [
  { label: "Last 7 days", value: "last_7_days" },
  { label: "Last month", value: "last_month" },
  { label: "Last 3 months", value: "last_3_months" },
];

export default function SimpleDashboard() {
  const { analytics: initialAnalytics, timeframe: initialTimeframe } = useLoaderData();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [analytics, setAnalytics] = useState(initialAnalytics);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetcher.load(`/api/analytics-dashboard-simple?timeframe=${timeframe}`);
    }, 10000);

    return () => clearInterval(interval);
  }, [timeframe]);

  // Update analytics when fetcher loads new data
  useEffect(() => {
    if (fetcher.data) {
      setAnalytics(fetcher.data);
    }
  }, [fetcher.data]);

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
    const url = new URL(window.location);
    url.searchParams.set('timeframe', newTimeframe);
    navigate(url.pathname + url.search);
  };

  return (
    <Page fullWidth>
      <TitleBar title="Visual Search Analytics" />
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="200" blockAlign="center">
            <Text as="h1" variant="headingLg">Analytics Dashboard</Text>
            {fetcher.state === "loading" && (
              <><Spinner size="small" /><Badge tone="info">Updating...</Badge></>
            )}
            {fetcher.state === "idle" && fetcher.data && (
              <Badge tone="success">Live</Badge>
            )}
          </InlineStack>
          <Select
            label="Timeframe"
            options={TIMEFRAME_OPTIONS}
            value={timeframe}
            onChange={handleTimeframeChange}
          />
        </InlineStack>

        <Layout>
          {/* Image Search Volume */}
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="400">
                <InlineStack gap="200" blockAlign="center">
                  <Text as="h2" variant="headingMd">Image Search Volume</Text>
                  <Tooltip content="Total number of image searches performed by customers">
                    <Icon source={InfoIcon} tone="subdued" />
                  </Tooltip>
                </InlineStack>
                <Text as="p" variant="heading3xl">
                  {analytics.imageSearchVolume.toLocaleString()}
                </Text>
                <Text as="span" variant="bodyMd" tone="subdued">Searches</Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Image Search Clicks */}
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="400">
                <InlineStack gap="200" blockAlign="center">
                  <Text as="h2" variant="headingMd">Image Search Clicks</Text>
                  <Tooltip content="Total number of clicks on search results">
                    <Icon source={InfoIcon} tone="subdued" />
                  </Tooltip>
                </InlineStack>
                <Text as="p" variant="heading3xl">
                  {analytics.imageSearchClicks.toLocaleString()}
                </Text>
                <Text as="span" variant="bodyMd" tone="subdued">Clicks</Text>
              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Click-Through Rate */}
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="400">
                <InlineStack gap="200" blockAlign="center">
                  <Text as="h2" variant="headingMd">Click-Through Rate</Text>
                  <Tooltip content="Percentage of searches that result in clicks">
                    <Icon source={InfoIcon} tone="subdued" />
                  </Tooltip>
                </InlineStack>
                <Text as="p" variant="heading3xl">
                  {analytics.clickThroughRate.toFixed(1)}%
                </Text>
                <Text as="span" variant="bodyMd" tone="subdued">CTR</Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Summary Card */}
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h3" variant="headingMd">Performance Summary</Text>
                <Text as="p" variant="bodyMd">
                  In the selected timeframe, customers performed <strong>{analytics.imageSearchVolume.toLocaleString()}</strong> image searches, 
                  resulting in <strong>{analytics.imageSearchClicks.toLocaleString()}</strong> clicks on search results. 
                  This represents a <strong>{analytics.clickThroughRate.toFixed(1)}%</strong> click-through rate.
                </Text>
                {analytics.clickThroughRate > 0 && (
                  <Text as="p" variant="bodySm" tone="subdued">
                    {analytics.clickThroughRate >= 20 
                      ? "Excellent performance! Your visual search is highly engaging."
                      : analytics.clickThroughRate >= 10
                      ? "Good performance. Consider optimizing search results for better engagement."
                      : "Consider improving search result quality or user experience to increase engagement."
                    }
                  </Text>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}

