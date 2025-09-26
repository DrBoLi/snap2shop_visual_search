import { useState, useEffect, useCallback } from "react";
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
import { authenticate } from "../shopify.server";
import db from "../db.server.js";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  let shop = session.shop;

  try {
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || 'last_month';
    
    // Check if we have data for the authenticated shop, if not use the database shop
    const existingShops = await db.visualSearchEvent.findMany({
      select: { shop: true },
      distinct: ['shop'],
      take: 5
    });
    
    const dbShops = existingShops.map(s => s.shop);
    console.log(`🔍 Available shops in database:`, dbShops);
    console.log(`🔍 Authenticated shop: ${shop}`);
    
    // If authenticated shop has no data, use the first available shop
    if (!dbShops.includes(shop) && dbShops.length > 0) {
      shop = dbShops[0];
      console.log(`⚠️ Using fallback shop: ${shop}`);
    }
    
    // Calculate date range
    const { startDate, endDate } = getDateRange(timeframe);
    
    // Get analytics data directly from database
    const imageSearchVolume = await db.visualSearchEvent.count({
      where: {
        shop,
        eventType: 'image_search',
        createdAt: { gte: startDate, lte: endDate }
      }
    });
    
    const imageSearchClicks = await db.searchResultClick.count({
      where: {
        shop,
        clickType: 'search_result',
        createdAt: { gte: startDate, lte: endDate }
      }
    });
    
    const clickThroughRate = imageSearchVolume > 0 
      ? (imageSearchClicks / imageSearchVolume) * 100 
      : 0;
    
    const analytics = {
      imageSearchVolume,
      imageSearchClicks,
      clickThroughRate: Math.round(clickThroughRate * 10) / 10
    };
    
    console.log(`📊 Dashboard data for ${shop}:`, analytics);
    console.log(`🔍 Shop comparison - Database: snap2shopdemo.myshopify.com, Authenticated: ${shop}`);
    console.log(`📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    return json({ analytics, timeframe });
  } catch (error) {
    console.error('Error loading dashboard:', error);
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

function getDateRange(timeframe) {
  const now = new Date();
  let startDate, endDate;

  switch (timeframe) {
    case 'last_7_days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'last_month':
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'last_3_months':
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    default:
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
  }

  endDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

const TIMEFRAME_OPTIONS = [
  { label: "Last 7 days", value: "last_7_days" },
  { label: "Last month", value: "last_month" },
  { label: "Last 3 months", value: "last_3_months" },
];

export default function Dashboard() {
  const { analytics: initialAnalytics, timeframe: initialTimeframe } = useLoaderData();
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [analytics, setAnalytics] = useState(initialAnalytics);
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
        setAnalytics(data);
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