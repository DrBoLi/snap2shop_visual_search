import { useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Card,
  Page,
  Layout,
  Text,
  Button,
  Banner,
  List,
  Divider,
  Link,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  return json({
    extensionInfo: {
      name: "Visual Search Widget",
      handle: "visual-search-widget",
      version: "1.0.0",
      status: "active"
    }
  });
};

export default function ThemeExtension() {
  const { extensionInfo } = useLoaderData();

  return (
    <Page
      title="Theme Extension - Visual Search Widget"
      subtitle="Customer-facing visual search functionality"
      backAction={{ url: "/app/visual-search" }}
    >
      <Layout>
        <Layout.Section>
          <Banner status="success">
            <p>
              Your visual search theme extension is ready to be installed on your storefront!
            </p>
          </Banner>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: "20px" }}>
              <Text variant="headingMd" as="h2">
                Extension Details
              </Text>
              <div style={{ marginTop: "16px" }}>
                <Text as="p">
                  <strong>Name:</strong> {extensionInfo.name}
                </Text>
                <Text as="p">
                  <strong>Handle:</strong> {extensionInfo.handle}
                </Text>
                <Text as="p">
                  <strong>Version:</strong> {extensionInfo.version}
                </Text>
                <Text as="p">
                  <strong>Status:</strong> {extensionInfo.status}
                </Text>
              </div>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: "20px" }}>
              <Text variant="headingMd" as="h2">
                Installation Instructions
              </Text>
              <div style={{ marginTop: "16px" }}>
                <Text as="p" color="subdued">
                  To add the visual search widget to your storefront:
                </Text>
                <div style={{ marginTop: "12px" }}>
                  <List type="number">
                    <List.Item>
                      Go to your Shopify Admin → Online Store → Themes
                    </List.Item>
                    <List.Item>
                      Click "Customize" on your active theme
                    </List.Item>
                    <List.Item>
                      Add a new section or block where you want the visual search widget
                    </List.Item>
                    <List.Item>
                      Look for "Visual Search" in the Apps section
                    </List.Item>
                    <List.Item>
                      Configure the widget settings (title, max results, file size limit)
                    </List.Item>
                    <List.Item>
                      Save and publish your theme
                    </List.Item>
                  </List>
                </div>
              </div>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: "20px" }}>
              <Text variant="headingMd" as="h2">
                Widget Features
              </Text>
              <div style={{ marginTop: "16px" }}>
                <List>
                  <List.Item>
                    <strong>Drag & Drop Upload:</strong> Customers can drag images directly or click to browse
                  </List.Item>
                  <List.Item>
                    <strong>Real-time Preview:</strong> Shows uploaded image before searching
                  </List.Item>
                  <List.Item>
                    <strong>Smart Search:</strong> Uses AI to find visually similar products
                  </List.Item>
                  <List.Item>
                    <strong>Configurable Results:</strong> Set max results (4-24 products)
                  </List.Item>
                  <List.Item>
                    <strong>Similarity Scores:</strong> Shows match percentage for each result
                  </List.Item>
                  <List.Item>
                    <strong>Mobile Responsive:</strong> Works perfectly on all devices
                  </List.Item>
                  <List.Item>
                    <strong>File Validation:</strong> Supports JPG, PNG, WebP up to 20MB
                  </List.Item>
                </List>
              </div>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: "20px" }}>
              <Text variant="headingMd" as="h2">
                Customization Options
              </Text>
              <div style={{ marginTop: "16px" }}>
                <Text as="p" color="subdued">
                  The visual search widget can be customized in the theme editor:
                </Text>
                <div style={{ marginTop: "12px" }}>
                  <List>
                    <List.Item>
                      <strong>Widget Title:</strong> Customize the main heading (default: "Find Similar Products")
                    </List.Item>
                    <List.Item>
                      <strong>Subtitle:</strong> Change the descriptive text below the title
                    </List.Item>
                    <List.Item>
                      <strong>Maximum Results:</strong> Control how many products to show (4, 8, 12, 16, 20, or 24)
                    </List.Item>
                    <List.Item>
                      <strong>File Size Limit:</strong> Set upload limit (5MB, 10MB, or 20MB)
                    </List.Item>
                  </List>
                </div>
              </div>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: "20px" }}>
              <Text variant="headingMd" as="h2">
                Technical Requirements
              </Text>
              <div style={{ marginTop: "16px" }}>
                <Banner status="info">
                  <p>
                    Make sure you have synced your products first using the Visual Search admin panel.
                  </p>
                </Banner>
                <div style={{ marginTop: "12px" }}>
                  <Text as="p">
                    The widget requires:
                  </Text>
                  <List>
                    <List.Item>Products to be synced with visual embeddings</List.Item>
                    <List.Item>App proxy configured (automatic)</List.Item>
                    <List.Item>Modern browser with JavaScript enabled</List.Item>
                  </List>
                </div>
              </div>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <div style={{ display: "flex", gap: "12px" }}>
            <Button
              variant="primary"
              url="/app/visual-search"
            >
              Back to Admin Panel
            </Button>
            <Button
              url="https://partners.shopify.com/current/resources/theme-extension"
              external
              variant="plain"
            >
              Learn More About Theme Extensions
            </Button>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}