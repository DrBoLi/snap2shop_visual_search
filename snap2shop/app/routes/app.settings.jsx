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
  Divider,
  TextField,
  Box,
  List,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getVisualSearchSettings, upsertVisualSearchSettings } from "../services/visualSearchSettings.server.js";
import logger from "../utils/logger.js";
import "../styles/homepage.css";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    const settings = await getVisualSearchSettings(shop);
    return json({ settings, shop });
  } catch (error) {
    logger.error('Error loading settings:', error);
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
    logger.error('Error saving settings:', error);
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
    <Page fullWidth>
      <TitleBar title="Settings" />

      <Box paddingBlockEnd="600">
        <Card>
          <div className="hero-section hero-gradient-bg">
            <div className="animated-blobs">
              <div className="blob blob-1"></div>
              <div className="blob blob-2"></div>
              <div className="blob blob-3"></div>
            </div>

            <div className="hero-content">
              <div className="hero-logo-container">
                <img
                  src="/snap2shop-logo-2.png"
                  alt="Snap2Shop Logo"
                  className="hero-logo"
                />
              </div>

              <div className="hero-badge">
                <span style={{ fontSize: '16px' }}>⚙️</span>
                <span>Visual Search Controls</span>
              </div>

              <h2 className="hero-heading">Fine-tune Your Visual Search</h2>

              <p className="hero-description">
                Adjust discovery settings, manage thresholds, and keep your catalog curated for the best shopper experience.
                Changes apply instantly across your storefront and embedded experiences.
              </p>

              <div className="hero-stats">
                <div className="hero-stat">
                  <div className="hero-stat-value">30s</div>
                  <div className="hero-stat-label">Average tweak time</div>
                </div>
                <div className="hero-stat hero-stat-divider">
                  <div className="hero-stat-value">0.4</div>
                  <div className="hero-stat-label">Recommended threshold</div>
                </div>
                <div className="hero-stat">
                  <div className="hero-stat-value">∞</div>
                  <div className="hero-stat-label">Syncs per day</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Box>

      <BlockStack gap="600">
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

        <div className="features-grid">
          <div className="feature-card">
            <Card>
              <Box padding="500">
                <BlockStack gap="500">
                  <div>
                    <div className="step-badge step-badge-blue">Configuration</div>
                    <Text as="h2" variant="headingXl">
                      Control Visual Search Behavior
                    </Text>
                    <Text as="p" variant="bodyMd">
                      Update product filtering and similarity logic to match your merchandising strategy.
                    </Text>
                  </div>

                  <Divider />

                  <FormLayout>
                    <FormLayout.Group>
                      <BlockStack gap="400">
                        <Text as="h3" variant="headingMd">
                          Product filtering
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

                  <InlineStack gap="300" align="end">
                    <Button onClick={handleReset} disabled={!hasChanges || isSubmitting}>
                      Reset
                    </Button>
                    <Button
                      primary
                      onClick={handleSubmit}
                      loading={isSubmitting}
                      disabled={!hasChanges || isSubmitting || Boolean(thresholdError)}
                    >
                      Save settings
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Box>
            </Card>
          </div>

          <div className="feature-card">
            <Card>
              <Box padding="500">
                <BlockStack gap="400">
                  <div>
                    <div className="step-badge step-badge-green">Best practices</div>
                    <Text as="h2" variant="headingLg">
                      Keep results fresh and relevant
                    </Text>
                  </div>

                  <List type="bullet">
                    <List.Item>Start with a threshold between 0.4 and 0.5 for balanced relevance and coverage.</List.Item>
                    <List.Item>Enable out-of-stock hiding so shoppers never land on unavailable items.</List.Item>
                    <List.Item>Re-run product syncs whenever you launch new collections or retire products.</List.Item>
                    <List.Item>Schedule routine embedding refreshes to reflect updated catalog imagery.</List.Item>
                  </List>

                  <Divider />

                  <Text as="p" variant="bodySm" tone="subdued">
                    Need help with deeper tuning? Visit the Help &amp; Support tab for advanced guides and troubleshooting tips, or contact our team anytime.
                  </Text>
                </BlockStack>
              </Box>
            </Card>
          </div>
        </div>
      </BlockStack>
    </Page>
  );

}
