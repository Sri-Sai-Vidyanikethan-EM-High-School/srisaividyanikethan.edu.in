const darkModeToggle = document.getElementById("darkModeToggle");
      const body = document.body;
      const socialIcons = document.querySelectorAll(".social-icon");
      const header = document.querySelector(".header");
      const footer = document.querySelector(".footer");
      const darkModeButton = document.getElementById("darkModeToggle");
      const moonIcon = "fa-regular fa-moon";
      const sunIcon = "fa-regular fa-sun";
      const searchBox = document.querySelector(".search-box");
      const searchBoxParagraph = document.querySelector(".search-box p");

      const savedTheme = localStorage.getItem("darkMode");
      if (savedTheme === "dark") {
        body.classList.add("dark-mode");
        socialIcons.forEach((icon) => icon.classList.add("dark-mode"));
        header.classList.add("dark-mode");
        footer.classList.add("dark-mode");
        darkModeButton.classList.add("dark-mode");
        darkModeButton.querySelector("i").className = sunIcon;
        searchBox.classList.add("dark-mode");
        searchBoxParagraph.classList.add("dark-mode");
      } else {
        darkModeButton.querySelector("i").className = moonIcon;
      }

      darkModeToggle.addEventListener("click", () => {
        body.classList.toggle("dark-mode");
        socialIcons.forEach((icon) => icon.classList.toggle("dark-mode"));
        header.classList.toggle("dark-mode");
        footer.classList.toggle("dark-mode");
        darkModeButton.classList.toggle("dark-mode");
        searchBox.classList.toggle("dark-mode");
        searchBoxParagraph.classList.toggle("dark-mode");

        if (body.classList.contains("dark-mode")) {
          localStorage.setItem("darkMode", "dark");
          darkModeButton.querySelector("i").className = sunIcon;
        } else {
          localStorage.setItem("darkMode", "light");
          darkModeButton.querySelector("i").className = moonIcon;
        }
      });

      var slideCount;
      var slideWidth;
      var slideHeight;
      var sliderUlWidth;

      $(function () {
        getRssFeed(
          "https://nsaraswathi.github.io/srisaividyanikethan-updates/feed.xml",
          mapFeed
        );

        $(".left-arrow").on("click", function () {
          moveLeft();
        });

        $(".right-arrow").on("click", function () {
          moveRight();
        });

        $(window).on("resize", function () {
          returnCarouselList();
        });

        // Automatically slide the carousel every 5 seconds
        setInterval(function () {
          moveRight();
        }, 6000);
      });

      function moveLeft() {
        $(".carousel").animate(
          {
            left: +slideWidth,
          },
          200,
          function () {
            $(".carousel li:last-child").prependTo(".carousel");
            $(".carousel").css("left", "");
          }
        );
      }

      function moveRight() {
        $(".carousel").animate(
          {
            left: -slideWidth,
          },
          200,
          function () {
            $(".carousel li:first-child").appendTo(".carousel");
            $(".carousel").css("left", "");
          }
        );
      }

      function getRssFeed(url, callback) {
        return feednami.loadGoogleFormat(encodeURI(url), callback);
      }

      function mapFeed(result) {
        if (result.error) {
          console.log(result.error);
        } else {
          createCarouselList(result.feed.entries.slice(0, 5));
          createFeedList(result.feed.entries.slice(0, 20));
        }
      }

      function createCarouselList(elements) {
        var list = [];
        $(elements).each(function (index, element) {
          list.push(
            "<li><h3><a href='" +
              element.link +
              "'>" +
              element.title +
              "</a></h3><p>" +
              new Date(element.publishedDate).toLocaleDateString("pt-BR") +
              "</p><span class='carousel-footer'>" +
              (index + 1) +
              " out of 5</span></li>"
          );
        });

        $(".carousel").append(list);
      }

      function createFeedList(elements) {
        var list = [];
        $(elements).each(function (index, element) {
          list.push(
            "<li><a href='" + element.link + "'>" + element.title + "</a></li>"
          );
        });
        $(".list").append(list);
        returnCarouselList();
      }

      function returnCarouselList() {
        slideCount = $(".carousel li").length;
        slideWidth = $(".carousel li").width();
        slideHeight = $(".carousel li").height();
        sliderUlWidth = slideCount * slideWidth;
        $(".slider").css({ width: slideWidth, height: slideHeight });
        $(".carousel").css({ width: sliderUlWidth, marginLeft: -slideWidth });
        $(".carousel li:last-child").prependTo(".carousel");
      }
