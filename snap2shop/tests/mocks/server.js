import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// Mock handlers for external APIs
const handlers = [
  // Mock Shopify Admin API
  http.post("https://*.myshopify.com/admin/api/*/graphql", async ({ request }) => {
    const query = await request.text();
    
    if (query.includes("getProducts")) {
      return HttpResponse.json({
        data: {
          products: {
            edges: [
              {
                node: {
                  id: "gid://shopify/Product/123",
                  title: "Test Product",
                  description: "Test Description",
                  tags: ["test", "sample"],
                  priceRangeV2: {
                    minVariantPrice: {
                      amount: "29.99",
                      currencyCode: "USD",
                    },
                  },
                  images: {
                    edges: [
                      {
                        node: {
                          url: "https://example.com/image.jpg",
                          altText: "Test Image",
                          width: 800,
                          height: 600,
                        },
                      },
                    ],
                  },
                },
                cursor: "eyJsYXN0X2lkIjoxMjMsImxhc3RfdmFsdWUiOiIxMjMifQ==",
              },
            ],
            pageInfo: {
              hasNextPage: false,
            },
          },
        },
      });
    }

    return HttpResponse.json({ data: {} });
  }),
];

// This configures a request mocking server with the given request handlers.
export const server = setupServer(...handlers);