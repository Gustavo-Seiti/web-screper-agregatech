import puppeteer from 'puppeteer';
import { runChat } from './gemini.js';


(async () => {

  const resultJobsSearch = await findJobs();
  const jobsRequirements = await mustHaveRequirements(resultJobsSearch);

  let geminiRequest = "";

  for (let i in jobsRequirements) {
    geminiRequest = geminiRequest.concat(`vaga_${[i]}` + " " + jobsRequirements[i].requisitos);
  }

  const jsonRequisite = await runChat(geminiRequest);
  const regex = /```json([\s\S]+?)```/;
  const match = jsonRequisite.match(regex);

  if (match) {
    const jsonContent = match[1].trim();

    console.log(jsonContent);
  } else {
    console.log("Nenhuma correspondência encontrada.");
  }


})();



async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0;
      const distance = 100;
      const scrollInterval = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(scrollInterval);
          resolve();
        }
      }, 100);
    });
  });
}

async function findJobs() {

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const linksVagas = [];

  await page.goto('https://portal.gupy.io/job-search/term=desenvolvedor%20backend%20node');
  await page.setViewport({ width: 1080, height: 1024 });
  await autoScroll(page);

  const returnedJobs = '.sc-e7227db9-0';
  await page.waitForSelector(returnedJobs);
  const divsReturnedJobs = await page.$$(returnedJobs);


  for (const div of divsReturnedJobs) {

    const anchorElement = await div.$('a');

    if (anchorElement) {
      const href = await anchorElement.evaluate(el => el.getAttribute('href'));
      linksVagas.push(href)
    }
  }

  console.log("Vagas encontradas: " + linksVagas.length);

  await browser.close();

  return linksVagas;
}


async function mustHaveRequirements(jobsArray) {

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const jobsRequirements = [];

  for (let i in jobsArray) {

    await page.goto(`${jobsArray[i]}`);
    await page.setViewport({ width: 1080, height: 1024 });
    await page.waitForSelector('.sc-add46fb1-1');
    const jobRequisitesSection = await page.$$(".sc-add46fb1-1");

    for (let j in jobRequisitesSection) {
      const hasH2 = await jobRequisitesSection[j].$('h2[data-testid="section-Requisitos e qualificações-title"]');

      if (hasH2) {

        const mustHaveRequisites = await jobRequisitesSection[j].$(".sc-add46fb1-3");

        const texto = await mustHaveRequisites.evaluate(el => el.textContent.trim());
        jobsRequirements.push({ link: jobsArray[i], requisitos: texto })

      } else {

      }

    }

  }


  await browser.close();

  return jobsRequirements;
}


