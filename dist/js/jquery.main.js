document.addEventListener("DOMContentLoaded", function() {
    // Fullscreen toggle
    var myElement = document.getElementById("myElement");
    if (myElement) {
        myElement.addEventListener("click", function() {
            toggleFullScreen(document.documentElement);
        });
    }

    // Handle individual row selection
    document.querySelectorAll('.selectRow').forEach(function(checkbox) {
        checkbox.addEventListener('change', function() {
            var row = this.closest('.responsive-table__row');
            if (this.checked) {
                row.classList.add('selected-row');
            } else {
                row.classList.remove('selected-row');
            }
            updateBodyClass();
        });
    });

    // Expand/collapse row functionality
    document.querySelectorAll('.responsive-table__row').forEach(function(row) {
        row.addEventListener('click', function() {
            this.classList.toggle('expanded');
            updateBodyClass();
        });
    });

    function updateBodyClass() {
        var checkedItems = document.querySelectorAll('.selectRow:checked').length;

        if (checkedItems === 0) {
            console.log('Выбрано 0 элементов');
            document.body.classList.remove('has-selected-rows', 'item-rows-1', 'item-rows-2');
        } else if (checkedItems === 1) {
            console.log('Выбран 1 элемент');
            document.body.classList.add('has-selected-rows', 'item-rows-1');
            document.body.classList.remove('item-rows-2');
        } else if (checkedItems >= 2) {
            document.body.classList.add('has-selected-rows', 'item-rows-2');
            document.body.classList.remove('item-rows-1');
        }
    }



    var initSideMenu = function initSideMenu() {
        var sideMenuBtn = document.getElementsByClassName('js-toggle-side-menu')[0],
            sideMenuBtnSecondLevel = document.querySelectorAll('.js-toggle-second-level-menu'),
            body = document.getElementsByTagName('body')[0],
            sideMenu = document.getElementsByClassName('js-side-menu')[0];

        var openSideNavigation = function openSideNavigation() {
            body.classList.remove('side-menu-closed');
        };

        var closeSideNavigation = function closeSideNavigation() {
            body.classList.add('side-menu-closed');
        };

        var closeSecondLevel = function closeSecondLevel() {
            var subMenuCollapseElementList = document.querySelectorAll('.js-sub-menu-collapse');
            subMenuCollapseElementList.forEach(function(element) {
                var instance = bootstrap.Collapse.getInstance(element);
                if (instance !== null) {
                    instance.hide();
                }
            });
        };

        if (sideMenuBtn) {
            sideMenuBtn.addEventListener('click', function() {
                if (body.classList.contains('side-menu-closed')) {
                    openSideNavigation();
                } else {
                    closeSideNavigation();
                }
            });
        }

        var readyForClose = true;

        sideMenuBtnSecondLevel.forEach(function(btn) {
            btn.addEventListener('click', function() {
                readyForClose = false;
                closeSecondLevel();
                openSideNavigation();
                setTimeout(function() {
                    readyForClose = true;
                }, 100);
            });
        });

        var mouseEnterToSecondLevelMenu = false;

        document.querySelectorAll('.js-second-level-menu').forEach(function(menu) {
            menu.addEventListener('mouseenter', function() {
                mouseEnterToSecondLevelMenu = true;
            });

            menu.addEventListener('mouseleave', function() {
                setTimeout(function() {
                    mouseEnterToSecondLevelMenu = false;
                }, 10);
            });
        });

        sideMenu.addEventListener('mousemove', function(e) {
            if (!e.target.closest('.js-second-level-menu') && body.classList.contains('second-level-menu-opened') && mouseEnterToSecondLevelMenu && readyForClose) {
                closeSecondLevel();
                openSideNavigation();
            }
        });

        sideMenu.addEventListener('mouseenter', function() {
            if (!body.classList.contains('second-level-menu-opened')) {
                openSideNavigation();
            }
        });

        sideMenu.addEventListener('mouseleave', function(e) {
            if (readyForClose && !body.classList.contains('second-level-menu-opened')) {
                closeSecondLevel();
                closeSideNavigation();
            }
        });

        // Обновленный обработчик кликов по телу страницы
        body.addEventListener('click', function(e) {
            // Если клик был вне бокового меню и его кнопок, закройте второе меню
            if (!e.target.closest('.js-side-menu') && !e.target.closest('.js-toggle-side-menu') && !e.target.closest('.js-toggle-second-level-menu') && !e.target.closest('.js-second-level-menu')) {

            }
        });

        var sideMenuWrap = document.getElementById('side-menu');
        if (sideMenuWrap) {
            sideMenuWrap.addEventListener('show.bs.collapse', function(event) {
                body.classList.add('second-level-menu-opened');
                setTimeout(function() {
                    closeSideNavigation();
                }, 10);
            });

            sideMenuWrap.addEventListener('hide.bs.collapse', function(event) {
                body.classList.remove('second-level-menu-opened');
            });
        }
    };

    document.addEventListener('DOMContentLoaded', initSideMenu);


    // STOP ANIMATIONS DURING WINDOW RESIZING
    var initStopAnimationsDuringWindowResizing = function initStopAnimationsDuringWindowResizing() {
        var resizeTimer;

        window.addEventListener('resize', function() {
            document.body.classList.add('resize-animation-stopper');

            clearTimeout(resizeTimer);

            resizeTimer = setTimeout(function() {
                document.body.classList.remove('resize-animation-stopper');
            }, 400);
        });
    };

    initSideMenu();
    initStopAnimationsDuringWindowResizing();
});

function toggleFullScreen(elem) {
    function closeSecondLevel() {
        var subMenuCollapseElementList = document.querySelectorAll('.js-sub-menu-collapse');
        subMenuCollapseElementList.forEach(function(element) {
            var instance = bootstrap.Collapse.getInstance(element);
            if (instance !== null) {
                instance.hide();
            }
        });
    }

    if (!document.fullscreenElement &&
        !document.mozFullScreenElement &&
        !document.webkitFullscreenElement &&
        !document.msFullscreenElement) {

        closeSecondLevel();

        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
        document.body.classList.add("fullscreen");
    } else {
        closeSecondLevel();

        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        document.body.classList.remove("fullscreen");
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Select all dropdowns with the data-control attribute
    var dropdowns = document.querySelectorAll('[data-control="checkbox-dropdown"]');

    dropdowns.forEach(function(dropdown) {
        var label = dropdown.querySelector('.dropdown-label');
        var closeBtn = dropdown.querySelector('.closeDropdown');

        if (label) {
            // Toggle the 'on' class when the label is clicked
            label.addEventListener('click', function(e) {
                e.preventDefault();
                dropdown.classList.toggle('on');
            });
        }

        if (closeBtn) {
            // Remove the 'on' class when the close button is clicked
            closeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                dropdown.classList.remove('on');
            });
        }

        // Close the dropdown when clicking outside of it
        document.addEventListener('click', function(e) {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('on');
            }
        });
    });
});


(function() {
    var CheckboxDropdown = function(el) {
        if (!el) return; // Check if the element exists
        var _this = this;
        this.isOpen = false;
        this.areAllChecked = false;
        this.el = el;
        this.label = this.el.querySelector('.dropdown-label');
        this.closeBtn = this.el.querySelector('.closeDropdown');
        this.inputs = this.el.querySelectorAll('[type="checkbox"]');

        if (!this.label || !this.inputs.length) return; // Check if essential elements exist

        this.onCheckBox();

        this.label.addEventListener('click', function(e) {
            e.preventDefault();
            _this.toggleOpen();
        });

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                _this.toggleOpen(false);
            });
        }

        this.inputs.forEach(function(input) {
            input.addEventListener('change', function(e) {
                _this.onCheckBox();
            });
        });
    };

    CheckboxDropdown.prototype.onCheckBox = function() {
        this.updateStatus();
    };

    CheckboxDropdown.prototype.updateStatus = function() {
        var checked = this.el.querySelectorAll(':checked');
        this.areAllChecked = false;

        if (checked.length <= 0) {
            // this.label.innerHTML = 'Select options';
        } else if (checked.length === this.inputs.length) {
            this.label.innerHTML = 'All Selected';
            this.areAllChecked = true;
        } else {
            var selectedTexts = Array.from(checked).map(function(input) {
                return input.parentNode.textContent.trim();
            }).join(', ');
            this.label.innerHTML = selectedTexts;
        }
    };

    CheckboxDropdown.prototype.toggleOpen = function(forceOpen) {
        var _this = this;

        if (!this.isOpen || forceOpen) {
            var filterContainer = this.el.closest('.filter-container');
            if (!filterContainer) return; // Check if the filter container exists

            var otherDropdowns = filterContainer.querySelectorAll('[data-control="checkbox-dropdown"].on');
            otherDropdowns.forEach(function(dropdown) {
                if (dropdown !== _this.el) {
                    dropdown.classList.remove('on');
                    var instance = dropdown.querySelector('.dropdown-label').dataset.instance;
                    if (instance) {
                        instance.isOpen = false;
                    }
                }
            });

            this.isOpen = true;
            this.el.classList.add('on');

            document.addEventListener('click', function clickHandler(e) {
                if (!e.target.closest('[data-control="checkbox-dropdown"]')) {
                    _this.toggleOpen(false);
                    document.removeEventListener('click', clickHandler);
                }
            });
        } else {
            this.isOpen = false;
            this.el.classList.remove('on');
        }
    };

    document.addEventListener('DOMContentLoaded', function() {
        var checkboxesDropdowns = document.querySelectorAll('[data-control="checkbox-dropdown"]');
        if (!checkboxesDropdowns.length) return; // Check if there are any dropdowns on the page

        checkboxesDropdowns.forEach(function(dropdown) {
            var instance = new CheckboxDropdown(dropdown);
            if (dropdown.querySelector('.dropdown-label')) {
                dropdown.querySelector('.dropdown-label').dataset.instance = instance;
            }
        });
    });
})();




document.addEventListener('DOMContentLoaded', function() {

    var successButton = document.getElementById('success');
    var modals = document.querySelectorAll('.modal');
    var mainContent = document.getElementById('mainContent');
    var formContent = document.getElementById('formContent');
    formContent.style.display = 'none';

    successButton.addEventListener('click', function() {

        modals.forEach(function(modal) {
            modal.style.display = 'none';
        });

        if (mainContent) {
            mainContent.style.display = 'none';
            formContent.style.display = 'block';
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    var dropdownElement = document.querySelector('.dropdown-toggle');
    dropdownElement.addEventListener('click', function() {});
});

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('openSearch').addEventListener('click', function() {
        var searchMain = document.querySelector('.searchMain');
        searchMain.style.display = 'block';
    });
});

document.addEventListener("DOMContentLoaded", function() {
    var rows = document.querySelectorAll('.responsive-table__row');
    if (rows.length > 0) {
        rows.forEach(function(row) {
            row.addEventListener('click', function() {
                console.log("Row clicked:", this);
                this.classList.toggle('clicked-row');
            });
        });
    } else {
        console.log("No rows found with class 'responsive-table__row'");
    }
});

document.addEventListener("DOMContentLoaded", function() {
    // Select all elements with the class 'btn-account'
    var buttons = document.querySelectorAll('.btn-account');

    // Check if buttons are found
    if (buttons.length > 0) {
        console.log(buttons.length + " buttons found");

        buttons.forEach(function(button) {
            button.addEventListener('click', function(event) {
                event.stopPropagation(); // Prevent the click event from propagating further
                this.classList.toggle('show');
                var dropdownMenu = this.nextElementSibling;
                if (dropdownMenu && dropdownMenu.classList.contains('dropdown-menu')) {
                    dropdownMenu.classList.toggle('show');
                }
            });
        });
    } else {
        console.log("No buttons found with class 'btn-account'");
    }

    // Close the dropdown if clicking outside
    document.addEventListener('click', function(event) {
        buttons.forEach(function(button) {
            var dropdownMenu = button.nextElementSibling;
            if (dropdownMenu && dropdownMenu.classList.contains('dropdown-menu')) {
                if (!button.contains(event.target) && !dropdownMenu.contains(event.target)) {
                    button.classList.remove('show');
                    dropdownMenu.classList.remove('show');
                }
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', (event) => {
    var dropdownToggle = document.getElementById('dropdownMenuButton');
    var dropdownMenu = document.getElementById('dropdownMenu');

    if (dropdownToggle && dropdownMenu) {
        dropdownToggle.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent the click event from bubbling up to the document
            var isExpanded = dropdownToggle.getAttribute('aria-expanded') === 'true';
            dropdownToggle.setAttribute('aria-expanded', !isExpanded);
            dropdownMenu.style.display = isExpanded ? 'none' : 'block';
        });

        // Close the dropdown menu when clicking outside of it
        document.addEventListener('click', function(event) {
            if (!dropdownToggle.contains(event.target)) {
                dropdownMenu.style.display = 'none';
                dropdownToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }
});



document.addEventListener('DOMContentLoaded', function() {
    var accountButton = document.getElementById('accountButton');
    var accountDropdownMenu = document.getElementById('accountDropdownMenu');

    accountButton.addEventListener('click', function(event) {
        event.stopPropagation();
        accountDropdownMenu.style.display = accountDropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', function(event) {
        if (!accountButton.contains(event.target)) {
            accountDropdownMenu.style.display = 'none';
        }
    });
});


window.onload = function() {
    window.onload = function() {
        var searchInputs = document.querySelectorAll('.search-input');

        searchInputs.forEach(function(searchInput) {
            searchInput.addEventListener('keyup', function() {
                var searchTerm = this.value.toLowerCase();
                var container = this.closest('.search-container');
                var options = container.querySelectorAll('.searchEnable .dropdown-option');
                var noResults = container.querySelector('.no-results');
                var matchFound = false;

                options.forEach(function(option) {
                    var titleText = option.querySelector('.title').textContent.toLowerCase();

                    if (titleText.includes(searchTerm)) {
                        option.style.display = 'flex';
                        matchFound = true;
                    } else {
                        option.style.display = 'none';
                    }
                });

                if (!matchFound) {
                    noResults.style.display = 'flex';
                } else {
                    noResults.style.display = 'none';
                }
            });
        });
    };
};

document.addEventListener('DOMContentLoaded', function() {
    const filterOpenElement = document.querySelector('.filterOpen');
    if (filterOpenElement) {
        filterOpenElement.addEventListener('click', function(event) {
            event.preventDefault();
            const filterContainer = document.querySelector('.filter-container');
            if (filterContainer) {
                filterContainer.classList.toggle('active');
            }
            filterOpenElement.classList.toggle('active');
        });
    }
});