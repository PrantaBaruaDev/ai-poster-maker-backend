import puppeteer, { type Browser } from "puppeteer";

let browserPromise: Promise<Browser> | null = null;

export const getBrowser = (): Promise<Browser> => {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--font-render-hinting=none",
      ],
    });
  }
  return browserPromise;
};

export const closeBrowser = async (): Promise<void> => {
  if (!browserPromise) return;
  const browser = await browserPromise;
  await browser.close();
  browserPromise = null;
};

class Semaphore {
  private queue: (() => void)[] = [];
  private running = 0;

  constructor(private readonly max: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.max) {
      this.running++;
      return;
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
    this.running++;
  }

  release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) next();
  }
}

const RENDER_CONCURRENCY = 2;
export const renderSemaphore = new Semaphore(RENDER_CONCURRENCY);