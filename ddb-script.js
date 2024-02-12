// ==UserScript==
// @name         DDB Book Downloader Full Implementation with Naming, Cover Art, and Title Header
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Fully functional DDB book downloader with content compilation, cover art, and a title header.
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

  function resizeImages() {
    $("img").each(function () {
      var image = $(this);
      // Assuming A4 dimensions in pixels at 96 DPI: 794x1123 (width x height)
      if (image.width() > 794) {
        image.css("width", "794px");
      }
      if (image.height() > 1123) {
        image.css("height", "1123px");
      }
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

    let coverArtUrl = $("a.ddb-lightbox-outer").attr("href");
    let fullBookTitle =
      $("h1.page-title").text().trim() + " - Print Friendly - DNDBeyond";

    Promise.all(contentPromises)
      .then(function (pages) {
        resizeImages(); // Call to resize images
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
                img {
                    max-width: 100%;
                    height: auto;
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
            </style>
          </head>
          <body>
              <div class="title-header">${fullBookTitle}</div>
              <img src="${coverArtUrl}" class="cover-image" alt="Cover Art">
              ${compiledContent}
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
