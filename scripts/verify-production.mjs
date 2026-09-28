const redirectChecks = [
  {
    url: 'https://teyfikgokdemir.com/reflex/',
    expected: 'https://ctseg.com.tr/tr/ticari-urunler/',
    label: 'retired Turkish REFLEX redirect',
  },
  {
    url: 'https://teyfikgokdemir.com/en/reflex/',
    expected: 'https://ctseg.com.tr/en/trade-products/',
    label: 'retired English REFLEX redirect',
  },
  {
    url: 'https://teyfikgokdemir.com/tr/',
    expected: 'https://teyfikgokdemir.com/',
    label: 'legacy Turkish root redirect',
  },
];

const pageChecks = [
  {
    url: 'https://teyfikgokdemir.com/',
    label: 'Turkish personal hub',
    verify: (response, body) =>
      response.ok &&
      body.includes('<html lang="tr" dir="ltr"') &&
      body.includes('property="og:locale" content="tr_TR"') &&
      body.includes('https://qctstudio.com/') &&
      body.includes('https://qctcommerce.com/') &&
      body.includes('https://ctseg.com.tr/') &&
      body.includes('hreflang="fa"') &&
      body.includes('hreflang="zh"') &&
      !/reflex/i.test(body),
  },
  {
    url: 'https://teyfikgokdemir.com/en/',
    label: 'English personal hub',
    verify: (response, body) =>
      response.ok &&
      body.includes('<html lang="en" dir="ltr"') &&
      body.includes('property="og:locale" content="en_US"') &&
      body.includes('hreflang="tr"') &&
      body.includes('hreflang="vi"') &&
      !/reflex/i.test(body),
  },
  {
    url: 'https://teyfikgokdemir.com/fa/',
    label: 'Persian personal hub',
    verify: (response, body) =>
      response.ok &&
      body.includes('<html lang="fa" dir="rtl"') &&
      body.includes('property="og:locale" content="fa_IR"') &&
      body.includes('hreflang="en"') &&
      !/reflex/i.test(body),
  },
  {
    url: 'https://teyfikgokdemir.com/zh/',
    label: 'Chinese personal hub',
    verify: (response, body) =>
      response.ok &&
      body.includes('<html lang="zh-CN" dir="ltr"') &&
      body.includes('property="og:locale" content="zh_CN"') &&
      body.includes('hreflang="sq"') &&
      !/reflex/i.test(body),
  },
  {
    url: 'https://teyfikgokdemir.com/vi/',
    label: 'Vietnamese personal hub',
    verify: (response, body) =>
      response.ok &&
      body.includes('<html lang="vi-VN" dir="ltr"') &&
      body.includes('property="og:locale" content="vi_VN"') &&
      body.includes('hreflang="sr"') &&
      !/reflex/i.test(body),
  },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (const check of redirectChecks) {
  let passed = false;
  let last = '';
  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      const response = await fetch(check.url, {
        redirect: 'manual',
        headers: { 'user-agent': 'Teyfik-Production-QA/2.0', 'cache-control': 'no-cache' },
      });
      const location = response.headers.get('location');
      last = `status=${response.status} location=${location}`;
      const absolute = location ? new URL(location, check.url).toString() : '';
      if ([301,302,307,308].includes(response.status) && absolute === check.expected) {
        console.log(`PASS: ${check.label} (attempt ${attempt})`);
        passed = true;
        break;
      }
    } catch (error) {
      last = String(error);
    }
    await wait(15000);
  }
  if (!passed) throw new Error(`Production verification failed: ${check.label}. Last response: ${last}`);
}

for (const check of pageChecks) {
  let passed = false;
  let last = '';
  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      const response = await fetch(check.url, {
        redirect: 'follow',
        headers: { 'user-agent': 'Teyfik-Production-QA/2.0', 'cache-control': 'no-cache' },
      });
      const body = await response.text();
      last = `status=${response.status} url=${response.url} body=${body.slice(0,180).replace(/\s+/g,' ')}`;
      if (check.verify(response, body)) {
        console.log(`PASS: ${check.label} (attempt ${attempt})`);
        passed = true;
        break;
      }
    } catch (error) {
      last = String(error);
    }
    await wait(15000);
  }
  if (!passed) throw new Error(`Production verification failed: ${check.label}. Last response: ${last}`);
}
