// ==UserScript==
// @name         DDB Book Downloader Full Implementation with Naming, Cover Art, Title Header, and Two-Column Layout
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Fully functional DDB book downloader with content compilation, cover art, a title header, and a two-column layout.
// @author       Code Wizard
// @match        https://www.dndbeyond.com/sources/*
// @icon         https://www.dndbeyond.com/favicon.ico
// @require      https://code.jquery.com/jquery-3.6.3.min.js
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

  function addDownloadButton() {
    if ($("#compilePDF").length === 0) {
      $(
        '<button id="compilePDF" style="margin-top: 20px;">Compile PDF</button>'
      )
        .insertAfter(".compendium-toc-full-text")
        .on("click", compileBook);
    }
  }

  function fetchPageContent(url) {
    return $.get(url)
      .then(function (data) {
        let pageContent = $("<div>")
          .append($.parseHTML(data))
          .find(".p-article-content, .article-content")
          .html();
        return pageContent
          ? pageContent
          : "<p>Content not found for " + url + "</p>";
      })
      .fail(function () {
        return "<p>Failed to load content from " + url + "</p>";
      });
  }

  function compileBook() {
    let pageUrls = $(".compendium-toc-full-text a")
      .not('[href*="#"]')
      .map(function () {
        return $(this).attr("href");
      })
      .get();

    let contentPromises = pageUrls.map(fetchPageContent);

    let coverArtUrl = $(".view-cover-art").attr("href");
    let fullBookTitle = $("h1.page-title").text().trim();

    Promise.all(contentPromises)
      .then(function (pages) {
        let compiledContent = pages.join(
          '<div style="page-break-after: always;"></div>'
        );
        let bookContent = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
              <meta charset="UTF-8">
              <title>${fullBookTitle}</title>
              <style>
                  body {
                      width: 210mm;
                      margin: auto;
                      padding: 20mm;
                      font-family: Arial, sans-serif;
                      line-height: 1.5;
                  }
                  @page {
                      size: A4;
                      margin: 20mm;
                  }
                  div.page-break {
                      page-break-after: always;
                  }
                  .cover-image {
                      width: 100%;
                      height: auto;
                      page-break-after: always;
                  }
                  .title-header {
                      text-align: center;
                      font-size: 2em;
                      margin-bottom: 20mm;
                  }
                  .content-area {
                      column-count: 2;
                      column-gap: 20mm;
                  }
                  .content-area img {
                      width: 100%;
                      column-span: all;
                  }
              </style>
          </head>
          <body>
              <div class="title-header">${fullBookTitle}</div>
              <img src="${coverArtUrl}" class="cover-image" alt="Cover Art">
              <div class="content-area">
                ${compiledContent}
              </div>
          </body>
          </html>
        `;

        let newWindow = window.open();
        newWindow.document.open();
        newWindow.document.write(bookContent);
        newWindow.document.close();
      })
      .catch(function (error) {
        alert("Error compiling book: " + error);
      });
  }

  $(document).ready(function () {
    addDownloadButton();
  });

  const observer = new MutationObserver(function () {
    addDownloadButton();
  });

  observer.observe(document, {
    childList: true,
    subtree: true,
  });
})();
