import { PlaywrightCrawler,Dataset, RequestQueue } from 'crawlee';

const queue = await RequestQueue.open('some-name');

await queue.addRequest({ url: 'https://openshop.uz/shop/subcategory/phones-6002'},{ forefront: true });
await queue.addRequest({ url: 'https://openshop.uz/shop/subcategory/c7v2c' });
await queue.addRequest({ url: 'https://openshop.uz/shop/category/appliances-6016' });
await queue.addRequest({ url: 'https://openshop.uz/shop/category/computers' });

const crawler = new PlaywrightCrawler({
    requestQueue:queue,
    maxRequestRetries: 2,
    navigationTimeoutSecs:160,

    requestHandler: async ({ page, request, enqueueLinks }) => {
        console.log(`Processing: ${request.url}`)
         if (request.label === 'DETAIL') {
            const imgs = await page.$$eval('[class="product-image"] img', (imgs) =>
            imgs.map((img) => img.getAttribute("src"))
            )
            
            const results = {
                productTitle: await page.locator('h1.product-title').textContent(),
                brand: await page.locator('span.product-category').textContent(),
                price: await page.locator('div.flex-container').locator('.product-price').locator('.new-price').textContent(),
                paymentTypes: await page.locator('.icon-box-content').nth(1).locator('p').textContent(),
                imgs            
            }

            await Dataset.pushData(results)
        } else {
            await page.waitForSelector('[aria-label="Next"]');
            await enqueueLinks({
                selector: '[aria-label="Next"]',
                label: 'LIST',
            })
            await page.waitForSelector('.product-media a');
            await enqueueLinks({
                selector: '.product-media a',
                label: 'DETAIL', 
            })
        }
    }
});

await crawler.run();