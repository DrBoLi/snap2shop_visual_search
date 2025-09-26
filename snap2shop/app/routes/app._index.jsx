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
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  return null;
};
export default function Index() {
  return (
    <Page>
      <TitleBar title="Snap2Shop Visual Search" />
      <BlockStack gap="500">
        <Card>
          <BlockStack gap="300">
            <Text as="h1" variant="headingLg">
              Bring visual discovery to your storefront
            </Text>
            <Text as="p" variant="bodyMd">
              Snap2Shop helps shoppers find the right products faster. Add
              visual search to your online store, tailor the search experience
              in theme sections, and monitor performance with a built-in
              analytics dashboard.
            </Text>
            <InlineStack gap="200" wrap>
              <Button url="/app/visual-search" variant="primary">
                Configure visual search
              </Button>
              <Button url="/app/dashboard" variant="secondary">
                View analytics dashboard
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Theme integration options
                </Text>
                <Text as="p" variant="bodyMd">
                  Offer visual search wherever shoppers expect it. You can
                  enable search from your storefront header and embed a
                  dedicated search module on landing pages or lookbooks.
                </Text>
                <List type="bullet">
                  <List.Item>
                    Header search bar integration with instant photo uploads
                  </List.Item>
                  <List.Item>
                    On-page visual search widget with drag-and-drop support
                  </List.Item>
                  <List.Item>
                    Optional call-to-action buttons to promote visual search in
                    merchandising sections
                  </List.Item>
                </List>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  What visual search unlocks
                </Text>
                <BlockStack gap="200">
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
                    copy="Track search volume, click rates, and search box engagement from the dashboard page."
                  />
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        <Layout>
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">
                  Need a hand?
                </Text>
                <Text as="p" variant="bodyMd">
                  Visit the setup guide for step-by-step instructions on
                  enabling theme app extensions and connecting your media
                  library.
                </Text>
                <Link
                  url="https://snap2shop.docs/setup"
                  target="_blank"
                  removeUnderline
                >
                  Snap2Shop setup guide
                </Link>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section>
            <Card>
              <BlockStack gap="200">
                <Text as="h3" variant="headingMd">
                  Quick start checklist
                </Text>
                <List type="number">
                  <List.Item>Enable the visual search theme app extension.</List.Item>
                  <List.Item>Configure the on-page widget appearance.</List.Item>
                  <List.Item>
                    Review dashboard insights to fine-tune recommendations.
                  </List.Item>
                </List>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
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
