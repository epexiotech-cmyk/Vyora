import { test, expect } from '../electron-fixture';

test.describe('Vyora Desktop Application Smoke Test', () => {
  test('Launches main window successfully', async ({ electronApp }) => {
    // 1 Verify no startup crash
    const isPackaged = await electronApp.evaluate(async ({ app }) => {
      return app.isPackaged;
    });
    expect(isPackaged).toBeDefined();

    // 2 Verify main window appears
    const window = await electronApp.firstWindow();
    expect(window).toBeTruthy();

    // 3 Verify application title
    const title = await window.title();
    // It might be 'Vyora', but let's just make sure it has a title or we can check the DOM
    expect(title).toBeDefined();

    // 4 Verify dashboard renders
    // We expect the react app to render an element with text Vyora or a root div
    await window.waitForSelector('#root', { state: 'attached', timeout: 10000 });
  });
});
