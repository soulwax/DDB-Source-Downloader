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
        let compiledContent = pages.join(
          '<div style="page-break-after: always;"></div>'
        );
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
                        padding: 20mm; /* Adjust padding as needed for inner margins */
                        font-family: Arial, sans-serif; /* Ensure text is legible */
                        line-height: 1.5; /* Improve readability */
                    }
                    @page {
                        size: A4;
                        margin: 20mm; /* Adjust outer margins for print */
                    }
                    div.page-break {
                        page-break-after: always;
                    }
                </style>
            </head>
            <body>${compiledContent}</body>
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
