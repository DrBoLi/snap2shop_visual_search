import { 
  Page, 
  Text, 
  Card, 
  BlockStack, 
  InlineStack, 
  Layout, 
  List, 
  Link, 
  Divider,
  Box,
  Button,
  Collapsible
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useState } from "react";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function Help() {
  const [setupExpanded, setSetupExpanded] = useState(false);
  const [integrationExpanded, setIntegrationExpanded] = useState(false);
  const [troubleshootingExpanded, setTroubleshootingExpanded] = useState(false);
  const [analyticsExpanded, setAnalyticsExpanded] = useState(false);

  return (
    <Page>
      <TitleBar title="Help & Support" />
      
      <BlockStack gap="500">
        {/* Welcome Section */}
        <Card>
          <Box padding="500">
            <BlockStack gap="300">
              <Text as="h1" variant="headingXl">
                Help & Support
              </Text>
              <Text as="p" variant="bodyLg">
                Get the most out of Snap2Shop with our comprehensive guides, troubleshooting tips, and support resources.
              </Text>
            </BlockStack>
          </Box>
        </Card>

        {/* Quick Start Checklist */}
        <Card>
          <Box padding="500">
            <BlockStack gap="300">
              <Text as="h2" variant="headingLg">
                Quick Start Checklist
              </Text>
              <List type="number">
                <List.Item>Enable the visual search theme app extension</List.Item>
                <List.Item>Configure the on-page widget appearance</List.Item>
                <List.Item>Review dashboard insights to fine-tune recommendations</List.Item>
                <List.Item>Test visual search functionality on your storefront</List.Item>
                <List.Item>Monitor analytics to optimize performance</List.Item>
              </List>
            </BlockStack>
          </Box>
        </Card>

        {/* Setup Guide */}
        <Card>
          <Box padding="500">
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingLg">
                  Setup Guide
                </Text>
                <Button
                  onClick={() => setSetupExpanded(!setupExpanded)}
                  variant="tertiary"
                >
                  {setupExpanded ? "Hide" : "Show"} Details
                </Button>
              </InlineStack>
              
              <Text as="p" variant="bodyMd">
                Follow our step-by-step setup guide to get Snap2Shop running on your store.
              </Text>
              
              <Link
                url="https://snap2shop.docs/setup"
                target="_blank"
                removeUnderline
              >
                📖 Snap2Shop Setup Guide
              </Link>

              <Collapsible
                open={setupExpanded}
                id="setup-collapsible"
                transition={{ duration: '200ms', timingFunction: 'ease-in-out' }}
              >
                <BlockStack gap="300">
                  <Divider />
                  <Text as="h3" variant="headingMd">Step-by-Step Setup:</Text>
                  <List type="number">
                    <List.Item>
                      <Text as="p" variant="bodyMd">
                        <strong>Install the App:</strong> Install Snap2Shop from the Shopify App Store
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="p" variant="bodyMd">
                        <strong>Enable Theme Extension:</strong> Go to Online Store → Themes → Customize and enable the visual search widget
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="p" variant="bodyMd">
                        <strong>Sync Products:</strong> Use the "Sync Products" button to index your catalog for visual search
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="p" variant="bodyMd">
                        <strong>Configure Widget:</strong> Customize the appearance and behavior of the visual search widget
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="p" variant="bodyMd">
                        <strong>Test & Launch:</strong> Test the functionality and monitor analytics for optimization
                      </Text>
                    </List.Item>
                  </List>
                </BlockStack>
              </Collapsible>
            </BlockStack>
          </Box>
        </Card>

        {/* Theme Integration Options */}
        <Card>
          <Box padding="500">
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingLg">
                  Theme Integration Options
                </Text>
                <Button
                  onClick={() => setIntegrationExpanded(!integrationExpanded)}
                  variant="tertiary"
                >
                  {integrationExpanded ? "Hide" : "Show"} Details
                </Button>
              </InlineStack>
              
              <Text as="p" variant="bodyMd">
                Offer visual search wherever shoppers expect it. You can enable search from your storefront header and embed a dedicated search module on landing pages or lookbooks.
              </Text>

              <Collapsible
                open={integrationExpanded}
                id="integration-collapsible"
                transition={{ duration: '200ms', timingFunction: 'ease-in-out' }}
              >
                <BlockStack gap="300">
                  <Divider />
                  <List type="bullet">
                    <List.Item>
                      <Text as="p" variant="bodyMd">
                        <strong>Header search bar integration:</strong> Add instant photo uploads to your existing search bar
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="p" variant="bodyMd">
                        <strong>On-page visual search widget:</strong> Embed a dedicated widget with drag-and-drop support on any page
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="p" variant="bodyMd">
                        <strong>Call-to-action buttons:</strong> Add promotional buttons in merchandising sections to encourage visual search usage
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="p" variant="bodyMd">
                        <strong>Collection pages:</strong> Enable visual search on category and collection pages for enhanced product discovery
                      </Text>
                    </List.Item>
                  </List>
                  
                  <Text as="h3" variant="headingMd">Integration Methods:</Text>
                  <List type="bullet">
                    <List.Item>
                      <Text as="p" variant="bodyMd">
                        <strong>Theme App Extensions:</strong> Use Shopify's native theme app extension system for seamless integration
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="p" variant="bodyMd">
                        <strong>Custom Implementation:</strong> Add visual search to custom themes using our JavaScript SDK
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="p" variant="bodyMd">
                        <strong>API Integration:</strong> Build custom solutions using our REST API for advanced use cases
                      </Text>
                    </List.Item>
                  </List>
                </BlockStack>
              </Collapsible>
            </BlockStack>
          </Box>
        </Card>

        {/* Analytics & Performance */}
        <Card>
          <Box padding="500">
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingLg">
                  Analytics & Performance
                </Text>
                <Button
                  onClick={() => setAnalyticsExpanded(!analyticsExpanded)}
                  variant="tertiary"
                >
                  {analyticsExpanded ? "Hide" : "Show"} Details
                </Button>
              </InlineStack>
              
              <Text as="p" variant="bodyMd">
                Track search volume, click rates, and search box engagement from the integrated dashboard to optimize your visual search performance.
              </Text>

              <Collapsible
                open={analyticsExpanded}
                id="analytics-collapsible"
                transition={{ duration: '200ms', timingFunction: 'ease-in-out' }}
              >
                <BlockStack gap="300">
                  <Divider />
                  <Text as="h3" variant="headingMd">Key Metrics:</Text>
                  <List type="bullet">
                    <List.Item>
                      <Text as="p" variant="bodyMd">
                        <strong>Image Search Volume:</strong> Total number of visual searches performed
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="p" variant="bodyMd">
                        <strong>Image Search Clicks:</strong> Number of clicks on search results
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="p" variant="bodyMd">
                        <strong>Click-Through Rate:</strong> Percentage of searches that result in clicks
                      </Text>
                    </List.Item>
                  </List>
                  
                  <Text as="h3" variant="headingMd">Optimization Tips:</Text>
                  <List type="bullet">
                    <List.Item>
                      <Text as="p" variant="bodyMd">
                        Monitor daily trends to identify peak usage times
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="p" variant="bodyMd">
                        Analyze click-through rates to improve search result relevance
                      </Text>
                    </List.Item>
                    <List.Item>
                      <Text as="p" variant="bodyMd">
                        Use A/B testing to optimize widget placement and design
                      </Text>
                    </List.Item>
                  </List>
                </BlockStack>
              </Collapsible>
            </BlockStack>
          </Box>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <Box padding="500">
            <BlockStack gap="300">
              <InlineStack align="space-between">
                <Text as="h2" variant="headingLg">
                  Troubleshooting
                </Text>
                <Button
                  onClick={() => setTroubleshootingExpanded(!troubleshootingExpanded)}
                  variant="tertiary"
                >
                  {troubleshootingExpanded ? "Hide" : "Show"} Details
                </Button>
              </InlineStack>
              
              <Text as="p" variant="bodyMd">
                Common issues and solutions to help you get the most out of Snap2Shop.
              </Text>

              <Collapsible
                open={troubleshootingExpanded}
                id="troubleshooting-collapsible"
                transition={{ duration: '200ms', timingFunction: 'ease-in-out' }}
              >
                <BlockStack gap="300">
                  <Divider />
                  
                  <Text as="h3" variant="headingMd">Common Issues:</Text>
                  
                  <BlockStack gap="400">
                    <Box>
                      <Text as="h4" variant="headingSm">
                        Visual search not appearing on storefront
                      </Text>
                      <List type="bullet">
                        <List.Item>Ensure the theme app extension is enabled in your theme customizer</List.Item>
                        <List.Item>Check that products have been synced successfully</List.Item>
                        <List.Item>Verify the widget is published and not in draft mode</List.Item>
                      </List>
                    </Box>
                    
                    <Box>
                      <Text as="h4" variant="headingSm">
                        Search results not accurate
                      </Text>
                      <List type="bullet">
                        <List.Item>Ensure product images are high quality and well-lit</List.Item>
                        <List.Item>Check that product titles and descriptions are descriptive</List.Item>
                        <List.Item>Consider re-syncing products to update the search index</List.Item>
                      </List>
                    </Box>
                    
                    <Box>
                      <Text as="h4" variant="headingSm">
                        Analytics not updating
                      </Text>
                      <List type="bullet">
                        <List.Item>Wait a few minutes for data to process</List.Item>
                        <List.Item>Check that the app proxy is configured correctly</List.Item>
                        <List.Item>Verify that search events are being tracked properly</List.Item>
                      </List>
                    </Box>
                    
                    <Box>
                      <Text as="h4" variant="headingSm">
                        Performance issues
                      </Text>
                      <List type="bullet">
                        <List.Item>Optimize product images for faster loading</List.Item>
                        <List.Item>Consider reducing the number of products indexed</List.Item>
                        <List.Item>Check your hosting provider's performance limits</List.Item>
                      </List>
                    </Box>
                  </BlockStack>
                </BlockStack>
              </Collapsible>
            </BlockStack>
          </Box>
        </Card>

        {/* Support Resources */}
        <Layout>
          <Layout.Section variant="oneHalf">
            <Card>
              <Box padding="500">
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">
                    📚 Documentation
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Comprehensive guides and API documentation
                  </Text>
                  <Link
                    url="https://snap2shop.docs"
                    target="_blank"
                    removeUnderline
                  >
                    View Documentation
                  </Link>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
          
          <Layout.Section variant="oneHalf">
            <Card>
              <Box padding="500">
                <BlockStack gap="300">
                  <Text as="h3" variant="headingMd">
                    💬 Contact Support
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Need help? Our support team is here to assist you.
                  </Text>
                  <Link
                    url="mailto:support@snap2shop.com"
                    removeUnderline
                  >
                    Email Support
                  </Link>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>

        {/* FAQ */}
        <Card>
          <Box padding="500">
            <BlockStack gap="300">
              <Text as="h2" variant="headingLg">
                Frequently Asked Questions
              </Text>
              
              <BlockStack gap="400">
                <Box>
                  <Text as="h4" variant="headingSm">
                    How does visual search work?
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Snap2Shop uses AI-powered image recognition to match uploaded images with products in your catalog. The system analyzes visual features like color, shape, and style to find the most relevant matches.
                  </Text>
                </Box>
                
                <Box>
                  <Text as="h4" variant="headingSm">
                    What image formats are supported?
                  </Text>
                  <Text as="p" variant="bodyMd">
                    We support all common image formats including JPEG, PNG, GIF, and WebP. For best results, use high-quality images with good lighting and clear product visibility.
                  </Text>
                </Box>
                
                <Box>
                  <Text as="h4" variant="headingSm">
                    How often should I sync my products?
                  </Text>
                  <Text as="p" variant="bodyMd">
                    We recommend syncing whenever you add new products or update existing product images. The sync process is fast and ensures your visual search index stays up-to-date.
                  </Text>
                </Box>
                
                <Box>
                  <Text as="h4" variant="headingSm">
                    Can I customize the visual search widget?
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Yes! You can customize colors, sizing, placement, and behavior through the theme customizer. Advanced customization options are available through our API.
                  </Text>
                </Box>
              </BlockStack>
            </BlockStack>
          </Box>
        </Card>
      </BlockStack>
    </Page>
  );
}
