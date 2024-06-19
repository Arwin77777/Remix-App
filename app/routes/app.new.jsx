import React, { useState } from 'react';
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useSubmit } from '@remix-run/react';
import shopify from "./app/shopify.server";
import { Button, Card, Layout, Page } from "@shopify/polaris";
import QRCode from 'qrcode.react';

export async function loader({ request }) {
  const { admin } = await shopify.authenticate.admin(request);
  const response = await admin.graphql(`
      {
        products(first: 10) {
          nodes {
            id
            title
            description
          }   
        }
      }
  `);

  const parsedResponse = await response.json();

  return json({
    products: parsedResponse.data.products.nodes,
  });
}


export async function action({request})
{
  const formData = await request.formData();
  const id = formData.get("id");
  const { admin } = await shopify.authenticate.admin(request);
  const response = await admin.graphql(`
      #graphql
      {
        product(id: "${id}") {
          onlineStorePreviewUrl
        }
      }
    `,
  );

  const res = await response.json();
  return json({
    url: res.data.product.onlineStorePreviewUrl,
  });
}


export default function ProductPage() {
  const { products } = useLoaderData();
  const submit = useSubmit();
  const actionData = useActionData();

  const handleQr = async (id) => {
    const formData = new FormData();
    formData.append("id",id);
    submit(formData, {replace: true, method: "POST",params:id});
  };
  return (
    <div>

      <Page>
        <Layout>
          <Layout.Section>
            <Card>
              <h1 >Store Products</h1>
              <ul>
                {products.map((product) => (
                  <li key={product.id}>
                    <h2>{product.title}</h2>
                    <p>{product.description}</p>
                    <Button variant="primary" onClick={() => handleQr(product.id)}>Create QR code</Button>
                    <br />
                  </li>
                ))}
              </ul>

              {actionData?.url && <div> <QRCode value={actionData.url}/> 
              <p>url:{actionData.url}</p></div>}
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </div>
  );
}
