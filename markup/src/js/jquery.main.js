jQuery(window).on('load', function() {

    initLogoGallery();
    initTabs();
    initTestimonials();
    initCookies();
    initFancybox();
    initDatePicker();
    initAnchors();
    initMainAnimation();
    animateOnScroll();
    initHeader();
    initActiveNav()
});


function animateOnScroll() {
    $('.animate-on-scroll').viewportChecker({
        classToAdd: 'visible', // Class to add to the elements when they are visible
        classToRemove: 'invisible', // Class to remove from the elements when they are visible
        offset: 60, // The offset from the bottom of the viewport, in pixels, to consider an element in view
        repeat: true, // Whether or not the animation should happen every time the element is in view
        invertBottomOffset: false, // Calculate offset from the top of the viewport instead of the bottom
        // callbackFunction: function(elem, action) { // Callback function when the element is in view
        //     console.log(elem, action);
        // },
        scrollHorizontal: false, // Check for horizontal scrolling
        removeClassAfterAnimation: false, // Remove class after animation ends
        percentage: 0.5 // Percentage of the element that should be in view
    });
}


$(window).load(function() {
    $("html").addClass("loaded");
})

function initActiveNav() {
    var navLinks = $(".nav li a");
    var currentUrl = window.location.pathname.split("/").pop();

    navLinks.each(function() {
        var linkUrl = $(this).attr("href");
        var listItem = $(this).parent();

        if (linkUrl === currentUrl) {
            $(".nav .active").removeClass("active");
            listItem.addClass("active");
        }
    });
}

function initHeader() {
    window.addEventListener('scroll', function() {
        var header = document.getElementById('header');
        if (window.scrollY > 50) {
            header.classList.add('shrink');
        } else {
            header.classList.remove('shrink');
        }
    });

}

function initMainAnimation() {

    const shapeCount = 70;
    const shapes = [];

    function createShapes() {
        shapes.forEach(shape => shape.remove()); // Remove existing shapes
        shapes.length = 0; // Clear the shapes array

        for (let i = 0; i < shapeCount; i++) {
            const shape = document.createElement('div');
            const size = Math.random() * 40 + 20; // 20 - 70px
            shape.style.width = `${size}px`;
            shape.style.height = `${size}px`;
            shape.style.top = `${Math.random() * 100}vh`;

            const maxX = window.innerWidth - size;
            shape.style.left = `${Math.random() * maxX}px`;

            if (Math.random() > 0.5) {
                shape.classList.add('shape', 'circle');
            } else {
                shape.classList.add('shape', 'square');
            }

            document.body.appendChild(shape);
            shapes.push(shape);
        }
    }

    function updateShapePositions() {
        shapes.forEach(shape => {
            const size = parseFloat(shape.style.width);
            const maxX = window.innerWidth - size;
            shape.style.left = `${Math.random() * maxX}px`;
        });
    }

    window.addEventListener('resize', updateShapePositions);

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        shapes.forEach((shape, index) => {
            const direction = index % 2 === 0 ? 1 : -1;
            const speed = (index % 5) + 1;
            shape.style.transform = `translateY(${scrollY * speed * direction * 0.1}px)`;
        });
    });

    createShapes();

}

function initDatePicker() {
    var condition = $('.datePickerHolder').size()
        // && false
    ;
    init(condition);

    function init(condition) {
        if (condition || condition == null) {
            $("#datepicker").datepicker();
        }
    }
}

function initCoworkingOptions() {
    var condition = $('.coworkingOptionsBtn').size()
        // && false
    ;
    init(condition);

    function init(condition) {
        if (condition || condition == null) {
            $(".coworkingOptionsBtn").on.click(
                function() {
                    jQuery('a.lightbox, [data-fancybox]').fancybox({
                        parentEl: 'body',
                        margin: [50, 0]
                    });
                }
            )

            $('.coworkingOptionsBtn').click(function() {
                $.fancybox.open($('.galleryimages').get(), {
                    arrows: true,
                    padding: 0,
                    //Additional Options
                });
            });

        }
    }
}

// lightbox init
function initFancybox() {
    jQuery('a.lightbox, [data-fancybox]').fancybox({
        parentEl: 'body',
        margin: [50, 0]
    });
}

function initTabs() {
    jQuery('.tabset').tabset({
        tabLinks: 'a',
        defaultTab: true
    });
    jQuery('.servicesTabset').tabset({
        tabLinks: 'a',
        defaultTab: true
    });
}


function initTestimonials() {
    var condition = $('.testimonialsSliderHolder').length
        // && false
    ;
    init(condition);

    function init(condition) {

        if (condition || condition == null) {

            $('.testimonialsSliderHolder .photo-slideset').slick({
                centerMode: true,
                centerPadding: 0,
                slidesToShow: 2,
                centerPadding: '100px',
                asNavFor: '.text-slideset',
                autoplay: true,
                infinite: true,
                autoplaySpeed: 2000,
                arrows: false,
                touchMove: false,
                swipe: false,

                //  dots: true
                responsive: [{
                    breakpoint: 992,
                    settings: {
                        slidesToShow: 3,
                        slidesToScroll: 1,
                        centerPadding: 0
                    }
                }]


            });

            $('.text-slideset').slick({
                slidesToShow: 1,
                slidesToScroll: 1,
                arrows: false,
                fade: true,
                infinite: true,
                touchMove: false,
                asNavFor: '.photo-slideset'
            });
        }
    }
}


function initLogoGallery() {
    var t, e = $(".logoGalleryHolder").length;
    ((t = e) || null == t) && $(".logoGalleryHolder").slick({
        dots: !1,
        slidesToShow: 6,
        slidesToScroll: 1,
        prevArrow: '<button class="slick-prev" aria-label="Previous" type="button" tabindex="0"><span class="icon icon-angle-left-regular"></span> </button>',
        nextArrow: '<button class="slick-next" aria-label="Next" type="button" tabindex="0"><span class="icon icon-angle-right-regular"></span></button>',
        responsive: [{
            breakpoint: 900,
            settings: {
                slidesToShow: 4,
                autoplay: true,
                infinite: true,
                autoplaySpeed: 5000

            }
        }, {
            breakpoint: 576,
            settings: {
                slidesToShow: 2,
                slidesToScroll: 1,
                autoplay: true,
                infinite: true,
                autoplaySpeed: 5000
            }
        }]
    })
}

function initAnchors() {
    var condition = $('.anchor').size()
        // && false
    ;
    init(condition);

    function init(condition) {
        if (condition || condition == null) {
            //Smooth Scrolling Using Navigation Menu

            new SmoothScroll({
                anchorLinks: '.anchor',
                extraOffset: 120,
                activeClasses: 'link',
                anchorActiveClass: 'anchor-active',
                wheelBehavior: 'none'
            });
        }
    }
}


function initCookies() {
    var condition = $('#cookiesBar').size()
        // && false
    ;
    init(condition);

    function init(condition) {
        if (condition || condition == null) {

            var setCookie = "";
            var messageBlock = $("#newsletterModal");

            setCookie = Cookies.get('gdpr-cookie');

            if (isCookieSet()) {
                $("#cookiesBar").hide();

            } else {
                $("#cookiesBar").show();
                $(".closeCookiesBtn").click(function() {
                    Cookies.set('gdpr-cookie', 'accepted', { expires: 365 });
                    $("#cookiesBar").hide();
                });
            }

            function isCookieSet() {
                if (setCookie == "accepted" || setCookie == "rejected") {
                    return true;
                }
            }
        }
    }
}


/*!
 * SmoothScroll module
 */
;
(function($, exports) {
    // private variables
    var page,
        win = $(window),
        activeBlock, activeWheelHandler,
        wheelEvents = ('onwheel' in document || document.documentMode >= 9 ? 'wheel' : 'mousewheel DOMMouseScroll');

    // animation handlers
    function scrollTo(offset, options, callback) {
        // initialize variables
        var scrollBlock;
        if (document.body) {
            if (typeof options === 'number') {
                options = {
                    duration: options
                };
            } else {
                options = options || {};
            }
            page = page || $('html, body');
            scrollBlock = options.container || page;
        } else {
            return;
        }

        // treat single number as scrollTop
        if (typeof offset === 'number') {
            offset = {
                top: offset
            };
        }

        // handle mousewheel/trackpad while animation is active
        if (activeBlock && activeWheelHandler) {
            activeBlock.off(wheelEvents, activeWheelHandler);
        }
        if (options.wheelBehavior && options.wheelBehavior !== 'none') {
            activeWheelHandler = function(e) {
                if (options.wheelBehavior === 'stop') {
                    scrollBlock.off(wheelEvents, activeWheelHandler);
                    scrollBlock.stop();
                } else if (options.wheelBehavior === 'ignore') {
                    e.preventDefault();
                }
            };
            activeBlock = scrollBlock.on(wheelEvents, activeWheelHandler);
        }

        // start scrolling animation
        scrollBlock.stop().animate({
            scrollLeft: offset.left,
            scrollTop: offset.top
        }, options.duration, function() {
            if (activeWheelHandler) {
                scrollBlock.off(wheelEvents, activeWheelHandler);
            }
            if ($.isFunction(callback)) {
                callback();
            }
        });
    }

    // smooth scroll contstructor
    function SmoothScroll(options) {
        this.options = $.extend({
            anchorLinks: 'a[href^="#"]', // selector or jQuery object
            container: null, // specify container for scrolling (default - whole page)
            extraOffset: null, // function or fixed number
            activeClasses: null, // null, "link", "parent"
            easing: 'swing', // easing of scrolling
            animMode: 'duration', // or "speed" mode
            animDuration: 800, // total duration for scroll (any distance)
            animSpeed: 1500, // pixels per second
            anchorActiveClass: 'anchor-active',
            sectionActiveClass: 'section-active',
            wheelBehavior: 'stop', // "stop", "ignore" or "none"
            useNativeAnchorScrolling: false // do not handle click in devices with native smooth scrolling
        }, options);
        this.init();
    }
    SmoothScroll.prototype = {
        init: function() {
            this.initStructure();
            this.attachEvents();
            this.isInit = true;
        },
        initStructure: function() {
            var self = this;

            this.container = this.options.container ? $(this.options.container) : $('html,body');
            this.scrollContainer = this.options.container ? this.container : win;
            this.anchorLinks = jQuery(this.options.anchorLinks).filter(function() {
                return jQuery(self.getAnchorTarget(jQuery(this))).length;
            });
        },
        getId: function(str) {
            try {
                return '#' + str.replace(/^.*?(#|$)/, '');
            } catch (err) {
                return null;
            }
        },
        getAnchorTarget: function(link) {
            // get target block from link href
            var targetId = this.getId($(link).attr('href'));
            return $(targetId.length > 1 ? targetId : 'html');
        },
        getTargetOffset: function(block) {
            // get target offset
            var blockOffset = block.offset().top;
            if (this.options.container) {
                blockOffset -= this.container.offset().top - this.container.prop('scrollTop');
            }

            // handle extra offset
            if (typeof this.options.extraOffset === 'number') {
                blockOffset -= this.options.extraOffset;
            } else if (typeof this.options.extraOffset === 'function') {
                blockOffset -= this.options.extraOffset(block);
            }
            return {
                top: blockOffset
            };
        },
        attachEvents: function() {
            var self = this;

            // handle active classes
            if (this.options.activeClasses && this.anchorLinks.length) {
                // cache structure
                this.anchorData = [];

                for (var i = 0; i < this.anchorLinks.length; i++) {
                    var link = jQuery(this.anchorLinks[i]),
                        targetBlock = self.getAnchorTarget(link),
                        anchorDataItem = null;

                    $.each(self.anchorData, function(index, item) {
                        if (item.block[0] === targetBlock[0]) {
                            anchorDataItem = item;
                        }
                    });

                    if (anchorDataItem) {
                        anchorDataItem.link = anchorDataItem.link.add(link);
                    } else {
                        self.anchorData.push({
                            link: link,
                            block: targetBlock
                        });
                    }
                };

                // add additional event handlers
                this.resizeHandler = function() {
                    if (!self.isInit) return;
                    self.recalculateOffsets();
                };
                this.scrollHandler = function() {
                    self.refreshActiveClass();
                };

                this.recalculateOffsets();
                this.scrollContainer.on('scroll', this.scrollHandler);
                win.on('resize.SmoothScroll load.SmoothScroll orientationchange.SmoothScroll refreshAnchor.SmoothScroll', this.resizeHandler);
            }

            // handle click event
            this.clickHandler = function(e) {
                self.onClick(e);
            };
            if (!this.options.useNativeAnchorScrolling) {
                this.anchorLinks.on('click', this.clickHandler);
            }
        },
        recalculateOffsets: function() {
            var self = this;
            $.each(this.anchorData, function(index, data) {
                data.offset = self.getTargetOffset(data.block);
                data.height = data.block.outerHeight();
            });
            this.refreshActiveClass();
        },
        toggleActiveClass: function(anchor, block, state) {
            anchor.toggleClass(this.options.anchorActiveClass, state);
            block.toggleClass(this.options.sectionActiveClass, state);
        },
        refreshActiveClass: function() {
            var self = this,
                foundFlag = false,
                containerHeight = this.container.prop('scrollHeight'),
                viewPortHeight = this.scrollContainer.height(),
                scrollTop = this.options.container ? this.container.prop('scrollTop') : win.scrollTop();

            // user function instead of default handler
            if (this.options.customScrollHandler) {
                this.options.customScrollHandler.call(this, scrollTop, this.anchorData);
                return;
            }

            // sort anchor data by offsets
            this.anchorData.sort(function(a, b) {
                return a.offset.top - b.offset.top;
            });

            // default active class handler
            $.each(this.anchorData, function(index) {
                var reverseIndex = self.anchorData.length - index - 1,
                    data = self.anchorData[reverseIndex],
                    anchorElement = (self.options.activeClasses === 'parent' ? data.link.parent() : data.link);

                if (scrollTop >= containerHeight - viewPortHeight) {
                    // handle last section
                    if (reverseIndex === self.anchorData.length - 1) {
                        self.toggleActiveClass(anchorElement, data.block, true);
                    } else {
                        self.toggleActiveClass(anchorElement, data.block, false);
                    }
                } else {
                    // handle other sections
                    if (!foundFlag && (scrollTop >= data.offset.top - 1 || reverseIndex === 0)) {
                        foundFlag = true;
                        self.toggleActiveClass(anchorElement, data.block, true);
                    } else {
                        self.toggleActiveClass(anchorElement, data.block, false);
                    }
                }
            });
        },
        calculateScrollDuration: function(offset) {
            var distance;
            if (this.options.animMode === 'speed') {
                distance = Math.abs(this.scrollContainer.scrollTop() - offset.top);
                return (distance / this.options.animSpeed) * 1000;
            } else {
                return this.options.animDuration;
            }
        },
        onClick: function(e) {
            var targetBlock = this.getAnchorTarget(e.currentTarget),
                targetOffset = this.getTargetOffset(targetBlock);

            e.preventDefault();
            scrollTo(targetOffset, {
                container: this.container,
                wheelBehavior: this.options.wheelBehavior,
                duration: this.calculateScrollDuration(targetOffset)
            });
            this.makeCallback('onBeforeScroll', e.currentTarget);
        },
        makeCallback: function(name) {
            if (typeof this.options[name] === 'function') {
                var args = Array.prototype.slice.call(arguments);
                args.shift();
                this.options[name].apply(this, args);
            }
        },
        destroy: function() {
            var self = this;

            this.isInit = false;
            if (this.options.activeClasses) {
                win.off('resize.SmoothScroll load.SmoothScroll orientationchange.SmoothScroll refreshAnchor.SmoothScroll', this.resizeHandler);
                this.scrollContainer.off('scroll', this.scrollHandler);
                $.each(this.anchorData, function(index) {
                    var reverseIndex = self.anchorData.length - index - 1,
                        data = self.anchorData[reverseIndex],
                        anchorElement = (self.options.activeClasses === 'parent' ? data.link.parent() : data.link);

                    self.toggleActiveClass(anchorElement, data.block, false);
                });
            }
            this.anchorLinks.off('click', this.clickHandler);
        }
    };

    // public API
    $.extend(SmoothScroll, {
        scrollTo: function(blockOrOffset, durationOrOptions, callback) {
            scrollTo(blockOrOffset, durationOrOptions, callback);
        }
    });

    // export module
    exports.SmoothScroll = SmoothScroll;
}(jQuery, this));








//= plugins.js