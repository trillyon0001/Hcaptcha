const puppeteer = require('puppeteer');
const fs = require('fs');
const { RequestInterceptionManager } = require('puppeteer-intercept-and-modify-requests');

async function automateLoginAndHCaptcha() {
    // Launch browser instance for login page
    const loginBrowser = await puppeteer.launch({ headless: false });
    const [loginPage] = await loginBrowser.pages();
    await loginPage.setDefaultNavigationTimeout(60000); // Increase timeout to 60 seconds

    await loginPage.goto('https://www.scottycameron.com/store/user/login/');

    await loginPage.type('input[data-test-selector="txtUserName"]', 'ttshepe2002@gmail.com');
    await loginPage.type('input[data-test-selector="txtLoginPassword"]', 'w%S8PCIRPMvAU2XW');

    // Launch a new browser instance for hCaptcha
    const hcaptchaBrowser = await puppeteer.launch({ headless: false });
    const [hcaptchaPage] = await hcaptchaBrowser.pages();
    await hcaptchaPage.setDefaultNavigationTimeout(60000); // Increase timeout to 60 seconds

    // Navigate to the desired URL for hCaptcha challenge
    await hcaptchaPage.goto('https://www.scottycameron.com/store/user/login/');

    // Read index.html file
    const indexHtmlContent = fs.readFileSync(__dirname + '/index.html', 'utf8');

    // Inject custom HTML content for hCaptcha challenge
    await hcaptchaPage.setContent(indexHtmlContent);

    // Wait for 5 seconds to ensure the hCaptcha challenge is fully loaded
    //await new Promise(resolve => setTimeout(resolve, 5000));

    //console.log("Waiting for checkcaptcha POST request...");
    // Extract the checkcaptcha request details from the hcaptchaPage context
    //const checkCaptchaRequest = await hcaptchaPage.waitForRequest(request =>
    //    request.url().includes('checkcaptcha') && request.method() === 'POST'
    //);

    // Fetch the POST data using fetchPostData() method
    //const checkCaptchaPayload = await checkCaptchaRequest.fetchPostData();

    // Extract the URL and headers from the checkcaptcha request
    //const checkCaptchaURL = checkCaptchaRequest.url();
    //const checkCaptchaHeaders = checkCaptchaRequest.headers();

    console.log("Waiting for checkcaptcha POST response...");
    // Listen for the 'checkcaptcha' request
    const checkCaptchaResponse = await hcaptchaPage.waitForResponse(response =>
        response.url().includes('checkcaptcha') && response.status() === 200 && response.request().method() === 'POST'
    );

    const responseBody = await checkCaptchaResponse.json();
    const generated_pass_UUID = responseBody.generated_pass_UUID;

    // Log the generated_pass_UUID
    console.log("generated_pass_UUID:", generated_pass_UUID);

    // Close the hCaptcha page after successful retrieval
    //await hcaptchaBrowser.close();

    // Inject the UUID directly into the login page's HTML
    await loginPage.evaluate((generated_pass_UUID) => {
        const iframe = document.querySelector('iframe[data-hcaptcha-widget-id]');
        iframe.setAttribute('data-hcaptcha-response', generated_pass_UUID);
    }, generated_pass_UUID);

    // Extract the value of data-hcaptcha-widget-id from the login page
    const hcaptchaWidgetId = await loginPage.evaluate(() => {
        const iframe = document.querySelector('iframe[data-hcaptcha-widget-id]');
        return iframe ? iframe.getAttribute('data-hcaptcha-widget-id') : null;
    });

    // Change the display style of g-recaptcha-response and h-captcha-response textareas to "block"
    await loginPage.evaluate((hcaptchaWidgetId) => {
        // Find the g-recaptcha-response and h-captcha-response textareas using the extracted hcaptchaWidgetId
        const gRecaptchaTextarea = document.querySelector(`textarea[id^="g-recaptcha-response-${hcaptchaWidgetId}"]`);
        const hCaptchaTextarea = document.querySelector(`textarea[id^="h-captcha-response-${hcaptchaWidgetId}"]`);

        // Check if the textareas are found before changing their display style
        if (gRecaptchaTextarea && hCaptchaTextarea) {
            gRecaptchaTextarea.style.display = 'block';
            hCaptchaTextarea.style.display = 'block';
        } else {
            console.error('Textarea elements not found.');
        }
    }, hcaptchaWidgetId);

    // Wait for a brief moment for the textarea styles to be updated
    await new Promise(resolve => setTimeout(resolve, 2000)); // Adjust the timeout value as needed

    async function setTextareaValue(selector, value) {
        await loginPage.evaluate((sel, val) => {
            const textarea = document.querySelector(sel);
            if (textarea) {
                textarea.focus(); // Ensure the textarea is focused
                textarea.value = val; // Set the value directly
                textarea.dispatchEvent(new Event('input', { bubbles: true })); // Dispatch an input event
            } else {
                console.error(`Textarea element with selector '${sel}' not found.`);
            }
        }, selector, value);
    }
    
    await setTextareaValue(`textarea[id^="g-recaptcha-response-${hcaptchaWidgetId}"]`, generated_pass_UUID);
    await setTextareaValue(`textarea[id^="h-captcha-response-${hcaptchaWidgetId}"]`, generated_pass_UUID);

    // Change the display style of g-recaptcha-response and h-captcha-response textareas to "block"
    //await loginPage.evaluate((hcaptchaWidgetId) => {
    //    // Find the g-recaptcha-response and h-captcha-response textareas using the extracted hcaptchaWidgetId
    //    const gRecaptchaTextarea = document.querySelector(`textarea[id^="g-recaptcha-response-${hcaptchaWidgetId}"]`);
    //    const hCaptchaTextarea = document.querySelector(`textarea[id^="h-captcha-response-${hcaptchaWidgetId}"]`);

    //    // Check if the textareas are found before changing their display style
    //    if (gRecaptchaTextarea && hCaptchaTextarea) {
    //        gRecaptchaTextarea.style.display = 'none';
    //        hCaptchaTextarea.style.display = 'none';
    //    } else {
    //        console.error('Textarea elements not found.');
    //    }
    //}, hcaptchaWidgetId);

        // Create a custom instance
    //const client = await loginPage.createCDPSession();
    //const requestInterceptionManager = new RequestInterceptionManager(client);

    //const interceptionConfig = {
    //    urlPattern: checkCaptchaURL,
    //    modifyResponse: async () => {
    //        // Return the responseBody as the modified response
    //        return {
    //            body: JSON.stringify(responseBody)
    //        };
    //    }
    //};

    //// Intercept the request and modify the response
    //await requestInterceptionManager.intercept(interceptionConfig);

    //try {
    //    // Make the checkcaptcha request within the browser context
    //    const makeCaptchaRequest = await loginPage.evaluate(async (url, payload, headers) => {
    //        try {
    //            const response = await fetch(url, {
    //                method: 'POST',
    //                headers: headers,
    //                body: payload
    //            });
    //            return await response.json();
    //        } catch (error) {
    //            throw new Error('Error making checkcaptcha request: ' + error.message);
    //        }
    //    }, checkCaptchaURL, checkCaptchaPayload, checkCaptchaHeaders);
    //
    //    // Log the response received from the browser context
    //    console.log("checkcaptcha response:", makeCaptchaRequest);
    //
    //    // Process the response as needed
    //} catch (error) {
    //    console.error(error);
    //}  

    // Call the callback function directly from the injected UUID with modified payload
    await loginPage.evaluate(() => {
        // Modify the payload with desired values
        const payload = {
            username: 'ttshepe2002@gmail.com',
            password: 'w%S8PCIRPMvAU2XW'
            // Add other fields as needed
        };

        // Call the callback function with the modified payload
        window.submitLoginReCaptchaCallback(payload);
    });


    // Log the response received from the browser context
    //console.log("GET request response:", makeGetRequest);

    // Process the response as needed


}

automateLoginAndHCaptcha();
