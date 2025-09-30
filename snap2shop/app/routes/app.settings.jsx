import { useState, useEffect } from "react";
import { useLoaderData, useActionData, useNavigation, useSubmit } from "@remix-run/react";
import { json } from "@remix-run/node";
import {
  Page,
  Text,
  Card,
  BlockStack,
  InlineStack,
  Checkbox,
  Button,
  Banner,
  FormLayout,
  Layout,
  Divider,
  TextField,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getVisualSearchSettings, upsertVisualSearchSettings } from "../services/visualSearchSettings.server.js";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    const settings = await getVisualSearchSettings(shop);
    return json({ settings, shop });
  } catch (error) {
    console.error('Error loading settings:', error);
    return json({
      settings: { hideOutOfStock: false, similarityThreshold: 0.4 },
      shop,
      error: 'Failed to load settings'
    });
  }
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    const formData = await request.formData();
    const hideOutOfStock = formData.get('hideOutOfStock') === 'true';
    const similarityThreshold = parseFloat(formData.get('similarityThreshold') || '0.4');

    const updatedSettings = await upsertVisualSearchSettings(shop, {
      hideOutOfStock,
      similarityThreshold,
    });

    return json({
      success: true,
      settings: updatedSettings,
      message: 'Settings saved successfully!'
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return json({
      success: false,
      error: 'Failed to save settings. Please try again.'
    }, { status: 500 });
  }
};

export default function Settings() {
  const { settings: initialSettings, shop, error: loadError } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();
  const shopify = useAppBridge();

  const [settings, setSettings] = useState(initialSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [thresholdError, setThresholdError] = useState('');

  const isSubmitting = navigation.state === 'submitting';

  // Update settings when they change
  useEffect(() => {
    if (actionData?.success && actionData?.settings) {
      setSettings(actionData.settings);
      setHasChanges(false);
    }
  }, [actionData]);

  // Show toast messages
  useEffect(() => {
    if (actionData?.success && actionData?.message) {
      shopify.toast.show(actionData.message);
    }
    if (actionData?.error) {
      shopify.toast.show(actionData.error, { isError: true });
    }
  }, [actionData, shopify]);

  const handleSettingChange = (field, value) => {
    // Validate similarity threshold
    if (field === 'similarityThreshold') {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0 || numValue > 0.9) {
        setThresholdError('Similarity threshold must be between 0.0 and 0.9');
      } else {
        setThresholdError('');
      }
      value = numValue;
    }

    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);

    // Check if settings have changed from initial values
    const changed = JSON.stringify(newSettings) !== JSON.stringify(initialSettings);
    setHasChanges(changed);
  };

  const handleSubmit = () => {
    // Don't submit if there are validation errors
    if (thresholdError) {
      shopify.toast.show('Please fix validation errors before saving', { isError: true });
      return;
    }

    const formData = new FormData();
    formData.append('hideOutOfStock', settings.hideOutOfStock.toString());
    formData.append('similarityThreshold', settings.similarityThreshold.toString());

    submit(formData, { method: 'post' });
  };

  const handleReset = () => {
    setSettings(initialSettings);
    setHasChanges(false);
    setThresholdError('');
  };

  return (
    <Page>
      <TitleBar title="Settings" />
      <BlockStack gap="500">
        {loadError && (
          <Banner status="critical">
            <p>{loadError}</p>
          </Banner>
        )}

        {actionData?.error && !actionData?.success && (
          <Banner status="critical">
            <p>{actionData.error}</p>
          </Banner>
        )}

        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <Text as="h1" variant="headingLg">
                  Visual Search Settings
                </Text>
                <Text as="p" variant="bodyMd">
                  Configure how visual search behaves for your customers.
                </Text>

                <Divider />

                <FormLayout>
                  <FormLayout.Group>
                    <BlockStack gap="400">
                      <Text as="h2" variant="headingMd">
                        Product Filtering
                      </Text>

                      <Checkbox
                        label="Hide out-of-stock products"
                        helpText="When enabled, visual search will only show products that are currently available for sale and have inventory."
                        checked={settings.hideOutOfStock}
                        onChange={(checked) => handleSettingChange('hideOutOfStock', checked)}
                      />

                      <TextField
                        label="Similarity threshold"
                        type="number"
                        value={settings.similarityThreshold.toString()}
                        onChange={(value) => handleSettingChange('similarityThreshold', value)}
                        error={thresholdError}
                        helpText="Minimum similarity score (0.0-0.9). Higher values show closer matches but fewer results. Default: 0.4"
                        min="0"
                        max="0.9"
                        step="0.1"
                        autoComplete="off"
                      />
                    </BlockStack>
                  </FormLayout.Group>
                </FormLayout>

                <Divider />

                <InlineStack gap="300">
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    disabled={!hasChanges || isSubmitting || thresholdError}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Settings'}
                  </Button>

                  {hasChanges && (
                    <Button
                      onClick={handleReset}
                      disabled={isSubmitting}
                    >
                      Reset
                    </Button>
                  )}
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingMd">
                  Current Configuration
                </Text>

                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="span" variant="bodyMd">Hide out-of-stock</Text>
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      {settings.hideOutOfStock ? 'Enabled' : 'Disabled'}
                    </Text>
                  </InlineStack>

                  <InlineStack align="space-between">
                    <Text as="span" variant="bodyMd">Similarity threshold</Text>
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      {settings.similarityThreshold}
                    </Text>
                  </InlineStack>

                  <InlineStack align="space-between">
                    <Text as="span" variant="bodyMd">Shop</Text>
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      {shop}
                    </Text>
                  </InlineStack>
                </BlockStack>

                <Divider />

                <BlockStack gap="200">
                  <Text as="h4" variant="headingSm">
                    How it works
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Configure how visual search filters and ranks results:
                  </Text>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd">
                      <strong>Hide out-of-stock:</strong> When enabled, filters results to only include products marked as available for sale with inventory greater than zero.
                    </Text>
                    <Text as="p" variant="bodyMd">
                      <strong>Similarity threshold:</strong> Controls the minimum similarity score (0.0-0.9) for search results. Higher values show closer matches but may return fewer results.
                    </Text>
                  </BlockStack>
                  <Text as="p" variant="bodyMd">
                    These settings help ensure customers see the most relevant and available products for their searches.
                  </Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}