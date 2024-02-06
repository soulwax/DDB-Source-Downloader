/* globals jQuery, $ */
// ==UserScript==
// @name         DDB Book Downloader Full Implementation
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Fully functional DDB book downloader with content compilation.
// @author       Code Wizard
// @match        https://www.dndbeyond.com/sources/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dndbeyond.com
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

    Promise.all(contentPromises)
      .then(function (pages) {
        let compiledContent = pages.join('<div class="page-break"></div>');
        let bookContent = `
                  <!DOCTYPE html>
                  <html lang="en">
                  <head>
                      <meta charset="UTF-8">
                      <title>Compiled Book</title>
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
                          .content {
                              column-count: 2; /* Create two columns */
                              column-gap: 20mm; /* Space between columns */
                              -webkit-column-count: 2;
                              -webkit-column-gap: 20mm;
                              -moz-column-count: 2;
                              -moz-column-gap: 20mm;
                          }
                          .page-break {
                              break-after: page; /* Ensure page breaks after each section */
                              -webkit-column-break-after: always;
                              page-break-after: always;
                              -moz-column-break-after: always;
                          }
                      </style>
                  </head>
                  <body>
                      <div class="content">${compiledContent}</div>
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
