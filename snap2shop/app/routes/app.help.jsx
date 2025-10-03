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
  Collapsible,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useState } from "react";
import "../styles/homepage.css";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function Help() {
  const [integrationExpanded, setIntegrationExpanded] = useState(false);
  const [troubleshootingExpanded, setTroubleshootingExpanded] = useState(false);
  const [analyticsExpanded, setAnalyticsExpanded] = useState(false);

  return (
    <Page fullWidth>
      <TitleBar title="Help & Support" />
      
      <BlockStack gap="600">

        {/* Quick Start Checklist */}
        <Card>
          <Box padding="500">
            <BlockStack gap="500">
              <div>
                <div className="step-badge">Quick Start</div>
                <Text as="h2" variant="headingXl">
                  Get Started in Minutes
                </Text>
              </div>
              <Text as="p" variant="bodyMd">
                Follow this simple checklist to get Snap2Shop up and running on your store.
              </Text>

              {/* Instructions Box */}
              <div className="instruction-box">
                <h4 className="instruction-title">Setup Checklist</h4>
                <ul className="instruction-list">
                  <li className="instruction-item">
                    <span className="instruction-number">1.</span>
                    <span>Enable the visual search theme app extension in your theme customizer</span>
                  </li>
                  <li className="instruction-item">
                    <span className="instruction-number">2.</span>
                    <span>Configure the on-page widget appearance to match your brand</span>
                  </li>
                  <li className="instruction-item">
                    <span className="instruction-number">3.</span>
                    <span>Review dashboard insights to fine-tune recommendations</span>
                  </li>
                  <li className="instruction-item">
                    <span className="instruction-number">4.</span>
                    <span>Test visual search functionality on your storefront</span>
                  </li>
                  <li className="instruction-item">
                    <span className="instruction-number">5.</span>
                    <span>Monitor analytics to optimize performance</span>
                  </li>
                </ul>
              </div>
            </BlockStack>
          </Box>
        </Card>

        {/* Theme Integration Options */}
        <Card>
          <Box padding="500">
            <BlockStack gap="500">
              <div>
                <div className="step-badge step-badge-blue">Integration</div>
                <Text as="h2" variant="headingXl">
                  Theme Integration Options
                </Text>
              </div>
              <Text as="p" variant="bodyMd">
                Offer visual search wherever shoppers expect it. You can enable search from your storefront header and embed a dedicated search module on landing pages or lookbooks.
              </Text>

              <InlineStack align="space-between">
                <Text as="h3" variant="headingMd">Integration Methods</Text>
                <Button
                  onClick={() => setIntegrationExpanded(!integrationExpanded)}
                  variant="tertiary"
                >
                  {integrationExpanded ? "Hide" : "Show"} Details
                </Button>
              </InlineStack>

              <Collapsible
                open={integrationExpanded}
                id="integration-collapsible"
                transition={{ duration: '200ms', timingFunction: 'ease-in-out' }}
              >
                <BlockStack gap="400">
                  <Divider />
                  
                  {/* Integration Types */}
                  <div className="features-grid">
                    <div className="feature-card">
                      <Card>
                        <Box padding="400">
                          <div className="feature-icon gradient-purple-pink">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="17,8 12,3 7,8"></polyline>
                              <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                          </div>
                          <Text as="h4" variant="headingSm">Header Search Bar</Text>
                          <Box paddingBlockStart="200">
                            <Text as="p" variant="bodyMd" tone="subdued">
                              Add instant photo uploads to your existing search bar with camera icon integration
                            </Text>
                          </Box>
                        </Box>
                      </Card>
                    </div>

                    <div className="feature-card">
                      <Card>
                        <Box padding="400">
                          <div className="feature-icon gradient-orange-pink">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <circle cx="8.5" cy="8.5" r="1.5"></circle>
                              <polyline points="21,15 16,10 5,21"></polyline>
                            </svg>
                          </div>
                          <Text as="h4" variant="headingSm">On-Page Widget</Text>
                          <Box paddingBlockStart="200">
                            <Text as="p" variant="bodyMd" tone="subdued">
                              Embed a dedicated widget with drag-and-drop support on any page
                            </Text>
                          </Box>
                        </Box>
                      </Card>
                    </div>

                    <div className="feature-card">
                      <Card>
                        <Box padding="400">
                          <div className="feature-icon gradient-pink-purple">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9 12l2 2 4-4"></path>
                              <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
                              <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
                              <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"></path>
                              <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"></path>
                            </svg>
                          </div>
                          <Text as="h4" variant="headingSm">Call-to-Action Buttons</Text>
                          <Box paddingBlockStart="200">
                            <Text as="p" variant="bodyMd" tone="subdued">
                              Add promotional buttons in merchandising sections to encourage visual search usage
                            </Text>
                          </Box>
                        </Box>
                      </Card>
                    </div>

                    <div className="feature-card">
                      <Card>
                        <Box padding="400">
                          <div className="feature-icon gradient-blue-purple">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"></path>
                              <path d="M3 12h18"></path>
                              <path d="M3 18h18"></path>
                            </svg>
                          </div>
                          <Text as="h4" variant="headingSm">Collection Pages</Text>
                          <Box paddingBlockStart="200">
                            <Text as="p" variant="bodyMd" tone="subdued">
                              Enable visual search on category and collection pages for enhanced product discovery
                            </Text>
                          </Box>
                        </Box>
                      </Card>
                    </div>
                  </div>

                  {/* Implementation Methods */}
                  <Text as="h3" variant="headingMd">Implementation Methods</Text>
                  <ul className="sync-process-list">
                    <li className="sync-process-item">
                      <div className="sync-dot dot-purple-pink"></div>
                      <Text as="span" variant="bodyMd" tone="subdued">
                        <strong>Theme App Extensions:</strong> Use Shopify's native theme app extension system for seamless integration
                      </Text>
                    </li>
                    <li className="sync-process-item">
                      <div className="sync-dot dot-pink-orange"></div>
                      <Text as="span" variant="bodyMd" tone="subdued">
                        <strong>Custom Implementation:</strong> Add visual search to custom themes using our JavaScript SDK
                      </Text>
                    </li>
                    <li className="sync-process-item">
                      <div className="sync-dot dot-blue-purple"></div>
                      <Text as="span" variant="bodyMd" tone="subdued">
                        <strong>API Integration:</strong> Build custom solutions using our REST API for advanced use cases
                      </Text>
                    </li>
                  </ul>
                </BlockStack>
              </Collapsible>
            </BlockStack>
          </Box>
        </Card>

        {/* Analytics & Performance */}
        <Card>
          <Box padding="500">
            <BlockStack gap="500">
              <div>
                <div className="step-badge step-badge-green">Analytics</div>
                <Text as="h2" variant="headingXl">
                  Analytics & Performance
                </Text>
              </div>
              <Text as="p" variant="bodyMd">
                Track search volume, click rates, and search box engagement from the integrated dashboard to optimize your visual search performance.
              </Text>

              <InlineStack align="space-between">
                <Text as="h3" variant="headingMd">Key Metrics & Optimization</Text>
                <Button
                  onClick={() => setAnalyticsExpanded(!analyticsExpanded)}
                  variant="tertiary"
                >
                  {analyticsExpanded ? "Hide" : "Show"} Details
                </Button>
              </InlineStack>

              <Collapsible
                open={analyticsExpanded}
                id="analytics-collapsible"
                transition={{ duration: '200ms', timingFunction: 'ease-in-out' }}
              >
                <BlockStack gap="400">
                  <Divider />
                  
                  {/* Key Metrics */}
                  <Text as="h3" variant="headingMd">Key Metrics</Text>
                  <div className="features-grid">
                    <div className="feature-card">
                      <Card>
                        <Box padding="400">
                          <div className="feature-icon gradient-purple-pink">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                              <circle cx="12" cy="13" r="3"></circle>
                            </svg>
                          </div>
                          <Text as="h4" variant="headingSm">Image Search Volume</Text>
                          <Box paddingBlockStart="200">
                            <Text as="p" variant="bodyMd" tone="subdued">
                              Total number of visual searches performed by customers
                            </Text>
                          </Box>
                        </Box>
                      </Card>
                    </div>

                    <div className="feature-card">
                      <Card>
                        <Box padding="400">
                          <div className="feature-icon gradient-orange-pink">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9 12l2 2 4-4"></path>
                              <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"></path>
                              <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"></path>
                              <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"></path>
                              <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"></path>
                            </svg>
                          </div>
                          <Text as="h4" variant="headingSm">Search Result Clicks</Text>
                          <Box paddingBlockStart="200">
                            <Text as="p" variant="bodyMd" tone="subdued">
                              Number of clicks on search results and recommendations
                            </Text>
                          </Box>
                        </Box>
                      </Card>
                    </div>

                    <div className="feature-card">
                      <Card>
                        <Box padding="400">
                          <div className="feature-icon gradient-pink-purple">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="20" x2="18" y2="10"></line>
                              <line x1="12" y1="20" x2="12" y2="4"></line>
                              <line x1="6" y1="20" x2="6" y2="14"></line>
                            </svg>
                          </div>
                          <Text as="h4" variant="headingSm">Click-Through Rate</Text>
                          <Box paddingBlockStart="200">
                            <Text as="p" variant="bodyMd" tone="subdued">
                              Percentage of searches that result in clicks on products
                            </Text>
                          </Box>
                        </Box>
                      </Card>
                    </div>

                    <div className="feature-card">
                      <Card>
                        <Box padding="400">
                          <div className="feature-icon gradient-blue-purple">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12,6 12,12 16,14"></polyline>
                            </svg>
                          </div>
                          <Text as="h4" variant="headingSm">Search Performance</Text>
                          <Box paddingBlockStart="200">
                            <Text as="p" variant="bodyMd" tone="subdued">
                              Average search response time and success rates
                            </Text>
                          </Box>
                        </Box>
                      </Card>
                    </div>
                  </div>

                  {/* Optimization Tips */}
                  <Text as="h3" variant="headingMd">Optimization Tips</Text>
                  <ul className="sync-process-list">
                    <li className="sync-process-item">
                      <div className="sync-dot dot-purple-pink"></div>
                      <Text as="span" variant="bodyMd" tone="subdued">
                        <strong>Monitor Daily Trends:</strong> Identify peak usage times to optimize widget placement and marketing campaigns
                      </Text>
                    </li>
                    <li className="sync-process-item">
                      <div className="sync-dot dot-pink-orange"></div>
                      <Text as="span" variant="bodyMd" tone="subdued">
                        <strong>Analyze Click-Through Rates:</strong> Improve search result relevance by analyzing which products get clicked most
                      </Text>
                    </li>
                    <li className="sync-process-item">
                      <div className="sync-dot dot-blue-purple"></div>
                      <Text as="span" variant="bodyMd" tone="subdued">
                        <strong>A/B Testing:</strong> Test different widget placements, designs, and messaging to optimize conversion
                      </Text>
                    </li>
                    <li className="sync-process-item">
                      <div className="sync-dot dot-orange-pink"></div>
                      <Text as="span" variant="bodyMd" tone="subdued">
                        <strong>Product Image Quality:</strong> Ensure high-quality, well-lit product images for better search accuracy
                      </Text>
                    </li>
                    <li className="sync-process-item">
                      <div className="sync-dot dot-purple-blue"></div>
                      <Text as="span" variant="bodyMd" tone="subdued">
                        <strong>Regular Sync:</strong> Keep your product catalog updated with regular syncing for optimal search results
                      </Text>
                    </li>
                  </ul>

                  {/* Performance Targets */}
                  <Text as="h3" variant="headingMd">Performance Targets</Text>
                  <div className="instruction-box">
                    <h4 className="instruction-title">Recommended Benchmarks</h4>
                    <ul className="instruction-list">
                      <li className="instruction-item">
                        <span className="instruction-number">•</span>
                        <span><strong>Search Response Time:</strong> Under 2 seconds for optimal user experience</span>
                      </li>
                      <li className="instruction-item">
                        <span className="instruction-number">•</span>
                        <span><strong>Click-Through Rate:</strong> Target 15-25% for healthy engagement</span>
                      </li>
                      <li className="instruction-item">
                        <span className="instruction-number">•</span>
                        <span><strong>Search Accuracy:</strong> 90%+ relevant results in top 5 matches</span>
                      </li>
                      <li className="instruction-item">
                        <span className="instruction-number">•</span>
                        <span><strong>Mobile Usage:</strong> 60%+ of searches should come from mobile devices</span>
                      </li>
                    </ul>
                  </div>
                </BlockStack>
              </Collapsible>
            </BlockStack>
          </Box>
        </Card>

        {/* Troubleshooting */}
        <Card>
          <Box padding="500">
            <BlockStack gap="500">
              <div>
                <div className="step-badge step-badge-orange">Troubleshooting</div>
                <Text as="h2" variant="headingXl">
                  Troubleshooting Guide
                </Text>
              </div>
              <Text as="p" variant="bodyMd">
                Common issues and solutions to help you get the most out of Snap2Shop. Find quick fixes for the most frequently encountered problems.
              </Text>

              <InlineStack align="space-between">
                <Text as="h3" variant="headingMd">Common Issues & Solutions</Text>
                <Button
                  onClick={() => setTroubleshootingExpanded(!troubleshootingExpanded)}
                  variant="tertiary"
                >
                  {troubleshootingExpanded ? "Hide" : "Show"} Details
                </Button>
              </InlineStack>

              <Collapsible
                open={troubleshootingExpanded}
                id="troubleshooting-collapsible"
                transition={{ duration: '200ms', timingFunction: 'ease-in-out' }}
              >
                <BlockStack gap="400">
                  <Divider />
                  
                  {/* Common Issues */}
                  <div className="features-grid">
                    <div className="feature-card">
                      <Card>
                        <Box padding="400">
                          <div className="feature-icon gradient-purple-pink">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                              <circle cx="12" cy="13" r="3"></circle>
                            </svg>
                          </div>
                          <Text as="h4" variant="headingSm">Visual Search Not Appearing</Text>
                          <Box paddingBlockStart="200">
                            <Text as="p" variant="bodyMd" tone="subdued">
                              Camera icon or widget not showing on storefront
                            </Text>
                          </Box>
                          <Box paddingBlockStart="300">
                            <ul className="instruction-list">
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Ensure the theme app extension is enabled in your theme customizer</span>
                              </li>
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Check that products have been synced successfully</span>
                              </li>
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Verify the widget is published and not in draft mode</span>
                              </li>
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Clear browser cache and refresh the page</span>
                              </li>
                            </ul>
                          </Box>
                        </Box>
                      </Card>
                    </div>

                    <div className="feature-card">
                      <Card>
                        <Box padding="400">
                          <div className="feature-icon gradient-orange-pink">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M8 12l2 2 4-4"></path>
                            </svg>
                          </div>
                          <Text as="h4" variant="headingSm">Search Results Not Accurate</Text>
                          <Box paddingBlockStart="200">
                            <Text as="p" variant="bodyMd" tone="subdued">
                              Poor search result quality or irrelevant matches
                            </Text>
                          </Box>
                          <Box paddingBlockStart="300">
                            <ul className="instruction-list">
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Ensure product images are high quality and well-lit</span>
                              </li>
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Check that product titles and descriptions are descriptive</span>
                              </li>
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Consider re-syncing products to update the search index</span>
                              </li>
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Adjust similarity threshold in settings for better precision</span>
                              </li>
                            </ul>
                          </Box>
                        </Box>
                      </Card>
                    </div>

                    <div className="feature-card">
                      <Card>
                        <Box padding="400">
                          <div className="feature-icon gradient-pink-purple">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="20" x2="18" y2="10"></line>
                              <line x1="12" y1="20" x2="12" y2="4"></line>
                              <line x1="6" y1="20" x2="6" y2="14"></line>
                            </svg>
                          </div>
                          <Text as="h4" variant="headingSm">Analytics Not Updating</Text>
                          <Box paddingBlockStart="200">
                            <Text as="p" variant="bodyMd" tone="subdued">
                              Dashboard showing zero or outdated analytics data
                            </Text>
                          </Box>
                          <Box paddingBlockStart="300">
                            <ul className="instruction-list">
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Wait a few minutes for data to process and sync</span>
                              </li>
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Check that the app proxy is configured correctly</span>
                              </li>
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Verify that search events are being tracked properly</span>
                              </li>
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Try refreshing the analytics dashboard</span>
                              </li>
                            </ul>
                          </Box>
                        </Box>
                      </Card>
                    </div>

                    <div className="feature-card">
                      <Card>
                        <Box padding="400">
                          <div className="feature-icon gradient-blue-purple">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                            </svg>
                          </div>
                          <Text as="h4" variant="headingSm">Performance Issues</Text>
                          <Box paddingBlockStart="200">
                            <Text as="p" variant="bodyMd" tone="subdued">
                              Slow search responses or widget loading times
                            </Text>
                          </Box>
                          <Box paddingBlockStart="300">
                            <ul className="instruction-list">
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Optimize product images for faster loading (compress to under 2MB)</span>
                              </li>
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Consider reducing the number of products indexed</span>
                              </li>
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Check your hosting provider's performance limits</span>
                              </li>
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Clear browser cache and test on different devices</span>
                              </li>
                            </ul>
                          </Box>
                        </Box>
                      </Card>
                    </div>

                    <div className="feature-card">
                      <Card>
                        <Box padding="400">
                          <div className="feature-icon gradient-purple-blue">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                              <line x1="12" y1="18" x2="12.01" y2="18"></line>
                            </svg>
                          </div>
                          <Text as="h4" variant="headingSm">Mobile Camera Issues</Text>
                          <Box paddingBlockStart="200">
                            <Text as="p" variant="bodyMd" tone="subdued">
                              Camera not working on mobile devices
                            </Text>
                          </Box>
                          <Box paddingBlockStart="300">
                            <ul className="instruction-list">
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Ensure HTTPS is enabled (required for camera access)</span>
                              </li>
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Grant camera permissions when prompted by browser</span>
                              </li>
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Check that camera is not being used by other apps</span>
                              </li>
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Try using the file upload option as alternative</span>
                              </li>
                            </ul>
                          </Box>
                        </Box>
                      </Card>
                    </div>

                    <div className="feature-card">
                      <Card>
                        <Box padding="400">
                          <div className="feature-icon gradient-pink-orange">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                            </svg>
                          </div>
                          <Text as="h4" variant="headingSm">Browser Compatibility</Text>
                          <Box paddingBlockStart="200">
                            <Text as="p" variant="bodyMd" tone="subdued">
                              Visual search not working in certain browsers
                            </Text>
                          </Box>
                          <Box paddingBlockStart="300">
                            <ul className="instruction-list">
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Use modern browsers: Chrome 90+, Firefox 85+, Safari 14+</span>
                              </li>
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Enable JavaScript and allow camera permissions</span>
                              </li>
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Disable ad blockers that might interfere with functionality</span>
                              </li>
                              <li className="instruction-item">
                                <span className="instruction-number">•</span>
                                <span>Update browser to latest version for best compatibility</span>
                              </li>
                            </ul>
                          </Box>
                        </Box>
                      </Card>
                    </div>
                  </div>

                  {/* Quick Fixes */}
                  <Text as="h3" variant="headingMd">Quick Fixes</Text>
                  <div className="instruction-box">
                    <h4 className="instruction-title">Emergency Troubleshooting Steps</h4>
                    <ul className="instruction-list">
                      <li className="instruction-item">
                        <span className="instruction-number">1.</span>
                        <span><strong>Refresh & Retry:</strong> Clear browser cache and refresh the page</span>
                      </li>
                      <li className="instruction-item">
                        <span className="instruction-number">2.</span>
                        <span><strong>Check Sync Status:</strong> Ensure products are properly synced in the dashboard</span>
                      </li>
                      <li className="instruction-item">
                        <span className="instruction-number">3.</span>
                        <span><strong>Test Different Browser:</strong> Try Chrome, Firefox, or Safari to isolate browser issues</span>
                      </li>
                      <li className="instruction-item">
                        <span className="instruction-number">4.</span>
                        <span><strong>Verify Theme Settings:</strong> Check that the visual search widget is enabled in theme customizer</span>
                      </li>
                      <li className="instruction-item">
                        <span className="instruction-number">5.</span>
                        <span><strong>Contact Support:</strong> If issues persist, reach out with specific error details</span>
                      </li>
                    </ul>
                  </div>
                </BlockStack>
              </Collapsible>
            </BlockStack>
          </Box>
        </Card>

        {/* FAQ */}
        <Card>
          <Box padding="500">
            <BlockStack gap="500">
              <div>
                <div className="step-badge step-badge-purple">FAQ</div>
                <Text as="h2" variant="headingXl">
                  Frequently Asked Questions
                </Text>
              </div>
              <Text as="p" variant="bodyMd">
                Quick answers to the most common questions about Snap2Shop visual search functionality.
              </Text>
              
              <div className="features-grid">
                <div className="feature-card">
                  <Card>
                    <Box padding="400">
                      <div className="feature-icon gradient-purple-pink">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                          <circle cx="12" cy="13" r="3"></circle>
                        </svg>
                      </div>
                      <Text as="h4" variant="headingSm">How does visual search work?</Text>
                      <Box paddingBlockStart="200">
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Snap2Shop uses AI-powered image recognition to match uploaded images with products in your catalog. The system analyzes visual features like color, shape, and style to find the most relevant matches.
                        </Text>
                      </Box>
                    </Box>
                  </Card>
                </div>

                <div className="feature-card">
                  <Card>
                    <Box padding="400">
                      <div className="feature-icon gradient-orange-pink">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21,15 16,10 5,21"></polyline>
                        </svg>
                      </div>
                      <Text as="h4" variant="headingSm">What image formats are supported?</Text>
                      <Box paddingBlockStart="200">
                        <Text as="p" variant="bodyMd" tone="subdued">
                          We support all common image formats including JPEG, PNG, GIF, and WebP. For best results, use high-quality images with good lighting and clear product visibility.
                        </Text>
                      </Box>
                    </Box>
                  </Card>
                </div>

                <div className="feature-card">
                  <Card>
                    <Box padding="400">
                      <div className="feature-icon gradient-pink-purple">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12,6 12,12 16,14"></polyline>
                        </svg>
                      </div>
                      <Text as="h4" variant="headingSm">How often should I sync my products?</Text>
                      <Box paddingBlockStart="200">
                        <Text as="p" variant="bodyMd" tone="subdued">
                          We recommend syncing whenever you add new products or update existing product images. The sync process is fast and ensures your visual search index stays up-to-date.
                        </Text>
                      </Box>
                    </Box>
                  </Card>
                </div>

                <div className="feature-card">
                  <Card>
                    <Box padding="400">
                      <div className="feature-icon gradient-blue-purple">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                          <path d="M2 2l7.586 7.586"></path>
                          <circle cx="11" cy="11" r="2"></circle>
                        </svg>
                      </div>
                      <Text as="h4" variant="headingSm">Can I customize the visual search widget?</Text>
                      <Box paddingBlockStart="200">
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Yes! You can customize colors, sizing, placement, and behavior through the theme customizer. Advanced customization options are available through our API.
                        </Text>
                      </Box>
                    </Box>
                  </Card>
                </div>

                <div className="feature-card">
                  <Card>
                    <Box padding="400">
                      <div className="feature-icon gradient-purple-blue">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                          <line x1="12" y1="18" x2="12.01" y2="18"></line>
                        </svg>
                      </div>
                      <Text as="h4" variant="headingSm">Is visual search mobile-friendly?</Text>
                      <Box paddingBlockStart="200">
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Absolutely! Snap2Shop is fully optimized for mobile devices with native camera integration, touch-friendly interfaces, and responsive design that works on all screen sizes.
                        </Text>
                      </Box>
                    </Box>
                  </Card>
                </div>

                <div className="feature-card">
                  <Card>
                    <Box padding="400">
                      <div className="feature-icon gradient-pink-orange">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      </div>
                      <Text as="h4" variant="headingSm">Is my data secure and private?</Text>
                      <Box paddingBlockStart="200">
                        <Text as="p" variant="bodyMd" tone="subdued">
                          Yes! Snap2Shop uses enterprise-grade security with full GDPR compliance. Images are processed client-side and never stored permanently. All data is encrypted and protected.
                        </Text>
                      </Box>
                    </Box>
                  </Card>
                </div>
              </div>
            </BlockStack>
          </Box>
        </Card>
      </BlockStack>
    </Page>
  );
}
