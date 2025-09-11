import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  ProgressBar,
  Banner,
  Modal,
  TextContainer,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function VisualSearch() {
  const [syncStatus, setSyncStatus] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
    <Page>
      <TitleBar title="Visual Search" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Product Synchronization
                </Text>
                <Text as="p" variant="bodyMd">
                  Sync your product catalog to enable visual search functionality. 
                  This will import your products and their images for processing.
                </Text>

                {hasError && (
                  <Banner status="critical">
                    <p>Sync failed: {syncStatus.errorMessage}</p>
                  </Banner>
                )}

                {isSyncing && (
                  <BlockStack gap="300">
                    <Banner status="info">
                      <p>Syncing products... {syncStatus.progress} of {syncStatus.totalItems}</p>
                    </Banner>
                    <ProgressBar progress={progress} size="small" />
                  </BlockStack>
                )}

                {isCompleted && syncStatus.lastSync && (
                  <Banner status="success">
                    <p>
                      Last sync completed on{" "}
                      {new Date(syncStatus.lastSync).toLocaleString()}.{" "}
                      Synced {syncStatus.totalItems} products.
                    </p>
                  </Banner>
                )}

                <InlineStack gap="300">
                  <Button
                    variant="primary"
                    loading={isSyncing || syncFetcher.state === "submitting"}
                    disabled={isSyncing}
                    onClick={handleSync}
                  >
                    {isSyncing ? "Syncing..." : hasError ? "Retry Sync" : "Start Sync"}
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
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
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
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  Sync Status
                </Text>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="span" variant="bodyMd">Status</Text>
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      {syncStatus?.status || "Loading..."}
                    </Text>
                  </InlineStack>
                  <InlineStack align="space-between">
                    <Text as="span" variant="bodyMd">Progress</Text>
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      {syncStatus?.progress || 0} / {syncStatus?.totalItems || 0}
                    </Text>
                  </InlineStack>
                  {syncStatus?.lastSync && (
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">Last Sync</Text>
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                        {new Date(syncStatus.lastSync).toLocaleDateString()}
                      </Text>
                    </InlineStack>
                  )}
                </BlockStack>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h2" variant="headingMd">
                  What happens during sync?
                </Text>
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd">
                    • Fetches all products from your store
                  </Text>
                  <Text as="p" variant="bodyMd">
                    • Downloads product images securely
                  </Text>
                  <Text as="p" variant="bodyMd">
                    • Stores metadata for search functionality
                  </Text>
                  <Text as="p" variant="bodyMd">
                    • Prepares data for visual search processing
                  </Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>

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
    </Page>
  );
}