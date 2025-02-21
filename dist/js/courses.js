document.addEventListener("DOMContentLoaded", function() {
    if (document.querySelector('.courses-main')) {
        const courses = [{
                "Id": 1,
                "Title": "1CLONE(410)",
                "Department": "English",
                "Instructor": "Jane Cooper",
                "OfficeHours": "Mon - Tue 5pm-6pm",
                "Average": "8.53 h",
                "MarkingTime": "90$",
                "Median": "90%",
                "Enrolled": 12,
                "Processed": "8.53 h",
                "Ghost": "90.9% | 93%",
                "Suspend": "90.9% | 93%",
                "Rating": 4.5
            },
            {
                "Id": 2,
                "Title": "1CLONE(410)",
                "Department": "Physics",
                "Instructor": "Dr. Jones",
                "OfficeHours": "Wed - Thu 10am-11am",
                "Average": "7.4 h",
                "MarkingTime": "85$",
                "Median": "85%",
                "Enrolled": 20,
                "Processed": "7.4 h",
                "Ghost": "89% | 90%",
                "Suspend": "88% | 91%",
                "Rating": 4.2
            }
            // Add more course objects as needed
        ];

        const coursesPerPage = 2; // Number of courses per page
        let currentPage = 1;
        let filteredCourses = [...courses]; // Filtered list of courses, initially contains all courses

        // Function to display courses with pagination
        function displayCourses(coursesToDisplay, page, perPage) {
            const tableBody = document.querySelector('.responsive-table.courses .responsive-table__body');
            if (!tableBody) return; // Check if tableBody exists

            tableBody.innerHTML = ''; // Clear the table before adding new data

            const start = (page - 1) * perPage;
            const end = start + perPage;
            const paginatedCourses = coursesToDisplay.slice(start, end);

            paginatedCourses.forEach(course => addCourseRow(course));

            const totalCountElement = document.getElementById('total-count-users');
            if (totalCountElement) {
                totalCountElement.textContent = coursesToDisplay.length;
            }

            // Add or remove the 'nonsearchresults' class based on the filtered count
            const tableElement = document.querySelector('.responsive-table.courses');
            const countElement = document.querySelector('.total-count');
            const controlPageElement = document.querySelector('.control-page');
            const buttonEditRow = document.querySelector('.button-edit-row');
            const errorElement = document.querySelector('.error');

            if (!tableElement || !countElement || !controlPageElement) {
                console.error("Required element(s) for displaying results not found.");
                return;
            }

            if (coursesToDisplay.length === 0) {
                tableElement.classList.add('nonsearchresults');
                countElement.classList.add('nonsearchresults');
                controlPageElement.classList.add('nonsearchresults');
                buttonEditRow.classList.add('nonsearchresults');
                if (errorElement) errorElement.classList.add('active');
            } else {
                tableElement.classList.remove('nonsearchresults');
                countElement.classList.remove('nonsearchresults');
                controlPageElement.classList.remove('nonsearchresults');
                buttonEditRow.classList.remove('nonsearchresults');
                if (errorElement) errorElement.classList.remove('active');
            }

            // Update pagination controls
            const prevPageButton = document.getElementById('prev-page');
            const nextPageButton = document.getElementById('next-page');
            const currentPageInput = document.getElementById('current-page');
            if (prevPageButton && nextPageButton && currentPageInput) {
                prevPageButton.classList.toggle('disabled', page === 1);
                nextPageButton.classList.toggle('disabled', end >= coursesToDisplay.length);
                currentPageInput.value = page;
            }

            // Re-initialize functionalities after rendering rows
            initSelectAll();
            initRowInteractions();
            initRowClickEvent();
        }

        // Function to filter courses
        function filterCourses() {
            const queryElement = document.getElementById('search-input');
            if (!queryElement) return; // Check if search input exists

            const query = queryElement.value.toLowerCase();

            // Display the skeleton while filtering
            displaySkeleton(coursesPerPage);

            setTimeout(() => {
                filteredCourses = courses.filter(course => {
                    const matchesSearch = course.Title.toLowerCase().includes(query) ||
                        course.Department.toLowerCase().includes(query) ||
                        course.Instructor.toLowerCase().includes(query);

                    return matchesSearch;
                });

                // Reset current page to the first one after filtering
                currentPage = 1;
                displayCourses(filteredCourses, currentPage, coursesPerPage);
            }, 1000); // Simulate a delay for the skeleton loader
        }

        // Attach event listeners
        const prevPageButton = document.getElementById('prev-page');
        const nextPageButton = document.getElementById('next-page');
        const currentPageInput = document.getElementById('current-page');

        if (prevPageButton) {
            prevPageButton.addEventListener('click', function() {
                if (currentPage > 1) {
                    currentPage--;
                    displayCourses(filteredCourses, currentPage, coursesPerPage);
                }
            });
        }

        if (nextPageButton) {
            nextPageButton.addEventListener('click', function() {
                if (currentPage * coursesPerPage < filteredCourses.length) {
                    currentPage++;
                    displayCourses(filteredCourses, currentPage, coursesPerPage);
                }
            });
        }

        if (currentPageInput) {
            currentPageInput.addEventListener('input', function() {
                let pageNumber = parseInt(this.value);
                if (pageNumber > 0 && pageNumber <= Math.ceil(filteredCourses.length / coursesPerPage)) {
                    currentPage = pageNumber;
                    displayCourses(filteredCourses, currentPage, coursesPerPage);
                }
            });
        }

        const searchInputElement = document.getElementById('search-input');
        if (searchInputElement) {
            searchInputElement.addEventListener('input', function() {
                filterCourses();
            });
        }

        // Simulate a long load time
        setTimeout(() => {
            displayCourses(filteredCourses, currentPage, coursesPerPage);
        }, 1000);

        // Display skeleton during data loading
        displaySkeleton(coursesPerPage);

        // Function to initialize the "Select all" functionality
        function initSelectAll() {
            const selectAllCheckbox = document.getElementById('select-all');
            if (selectAllCheckbox) {
                selectAllCheckbox.addEventListener('change', function() {
                    const isChecked = this.checked;
                    const rows = document.querySelectorAll('.responsive-table__row');
                    rows.forEach(function(row) {
                        const checkbox = row.querySelector('.selectRow');
                        if (checkbox) {
                            checkbox.checked = isChecked;
                            if (isChecked) {
                                row.classList.add('selected-row');
                            } else {
                                row.classList.remove('selected-row');
                            }
                        }
                    });
                    updateBodyClass(); // Update the body class after the selection
                });
            }
        }

        // Function to initialize row click functionality
        function initRowClickEvent() {
            const rows = document.querySelectorAll('.responsive-table__row');
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
        }

        // Function to initialize row interactions (expand/collapse and selection)
        function initRowInteractions() {
            document.querySelectorAll('.responsive-table__row').forEach(function(row) {
                row.addEventListener('click', function() {
                    this.classList.toggle('expanded');
                    updateBodyClass();
                });
            });
        }

        // Function to update body class based on row selection
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

        // Adding a course row to the table
        function addCourseRow(courseData) {
            const tableBody = document.querySelector('.responsive-table.courses .responsive-table__body');
            if (!tableBody) return; // Check if tableBody exists

            const newRow = document.createElement('tr');
            newRow.classList.add('responsive-table__row');

            newRow.innerHTML = `
                <td class="responsive-table__body__text main-item responsive-table__body__text--name">
                    <label class="custom-checkbox">
                        <input type="checkbox" class="selectRow">
                        <span class="checkmark"></span>
                    </label>
                    <div class="main-item-holder">
                        <div class="content">
                            <span class="name pr">${courseData.Title}</span>
                            <span class="stars"><i class="icon icomoon-star-full-1"></i> ${courseData.Rating}</span>
                        </div>
                        <div class="content autor">
                            <div class="">
                                <span class="instructor pr">${courseData.Instructor}</span>
                                <span class="stars"><i class="icon icomoon-star-full-1"></i> ${courseData.Rating}</span>
                            </div>
                        </div>
                    </div>
                </td>
                <td class="responsive-table__body__text responsive-table__body__text--status">
                    <div class="mobile-holder">
                        <div class="lebel-mobile">Department</div>
                        <div class="">${courseData.Department}</div>
                    </div>
                </td>
                <td class="responsive-table__body__text responsive-table__body__text--update tablet-hide">
                    <div class="mobile-holder">
                        <div class="lebel-mobile">Instructor</div>
                        <div class="d-flex flex-wrap">
                            <span class="instructor pr">${courseData.Instructor}</span>
                            <span class="stars"><i class="icon icomoon-star-full-1"></i> ${courseData.Rating}</span>
                        </div>
                    </div>
                </td>
                <td class="responsive-table__body__text responsive-table__body__text--country">
                    <div class="mobile-holder">
                        <div class="lebel-mobile">Office Hours</div>
                        <div class="d-flex flex-wrap">
                            <span class="pr">${courseData.OfficeHours}</span>
                            <span class="secondary-text"></span>
                        </div>
                    </div>
                </td>
                <td class="responsive-table__body__text responsive-table__body__text--types">
                    <div class="mobile-holder">
                        <div class="lebel-mobile">Average</div>
                        <div class="d-flex flex-wrap">
                            <span class="main-title">Marking Time</span> <span class="hours">${courseData.Average}</span>
                            <ul class="detail-list clearfix">
                                <li><span class="title">Avg</span> <span class="value">${courseData.MarkingTime}</span></li>
                                <li><span class="title">Med</span><span class="value">${courseData.Median}</span></li>
                            </ul>
                        </div>
                    </div>
                </td>
                <td class="responsive-table__body__text responsive-table__body__text--country hover-table">
                    <div class="mobile-holder">
                        <div class="lebel-mobile">Enrolled</div>
                        <div class="mobile-show">
                            <div>
                                <b>Processed</b> <span>${courseData.Processed}</span>
                            </div>
                            <div>
                                <b>Ghost</b> <span>${courseData.Ghost}</span>
                            </div>
                            <div>
                                <b>Suspend</b> <span>${courseData.Suspend}</span>
                            </div>
                        </div>
                    </div>
                    <div class="d-flex flex-wrap hover-trigger">
                        <span class="pr">${courseData.Enrolled}</span><i class="icomoon-info-1"></i>
                        <div class="hover-popup">
                            <div><p>Processed</p> <span>${courseData.Processed}</span></div>
                            <div><p>Ghost</p> <span>${courseData.Ghost}</span></div>
                            <div><p>Suspend</p> <span>${courseData.Suspend}</span></div>
                        </div>
                    </div>
                </td>
            `;

            tableBody.appendChild(newRow);
        }

        // Display skeleton during data loading
        function displaySkeleton(numRows) {
            const tableBody = document.querySelector('.responsive-table.courses .responsive-table__body');
            if (!tableBody) return; // Check if tableBody exists

            tableBody.innerHTML = ''; // Clear the table before adding the skeleton

            for (let i = 0; i < numRows; i++) {
                const skeletonRow = document.createElement('tr');
                skeletonRow.classList.add('responsive-table__row');

                skeletonRow.innerHTML = `
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="w-100">
                            <div class="skeleton-item animate-pulse rounded-2 mb-6 mt-6" style="height: 16px; width: 100%;"></div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="skeleton-item animate-pulse rounded-2 mb-6 mt-6" style="height: 16px; width: 100%;"></div>
                </td>
                <td>
                    <div class="skeleton-item animate-pulse rounded-2 mb-6 mt-6" style="height: 16px; width: 100%;"></div>
                </td>
                <td>
                    <div class="skeleton-item animate-pulse rounded-2 mb-6 mt-6" style="height: 16px; width: 100%;"></div>
                </td>
                <td>
                    <div class="skeleton-item animate-pulse rounded-2 mb-6 mt-6" style="height: 16px; width: 100%;"></div>
                </td>
                <td>
                    <div class="skeleton-item animate-pulse rounded-2 mb-6 mt-6" style="height: 16px; width: 100%;"></div>
                </td>
                `;

                tableBody.appendChild(skeletonRow);
            }
        }
    }
});