document.addEventListener("DOMContentLoaded", function() {
            if (document.querySelector('.users-main')) {
                const users = [{
                        "Id": 1,
                        "Name": "Jessica Hanson",
                        "Email": "jessica.hanson@example.com",
                        "Enabled": "false",
                        "Status": [
                            { "icon": "text", "name": "18+" },
                            { "icon": "icomoon-briefcase", "name": "Business" },
                            { "icon": "icomoon-flag red", "name": "Red Flag" },
                            { "icon": "icomoon-man", "name": "Adult" }
                        ],
                        "Flag": "red",
                        "CreationDate": "2020-05-03",
                        "LastLogin": "30 days ago",
                        "Courses": ["ENG4U-03", "ENG4U-03", "ENG4U-03", "ENG4U-03"]
                    },
                    {
                        "Id": 2,
                        "Name": "Jessica Hanson",
                        "Email": "jessica.hanson@example.com",
                        "Enabled": "false",
                        "Status": [
                            { "icon": "text", "name": "18+" },
                            { "icon": "icomoon-briefcase", "name": "Business" },
                            { "icon": "icomoon-flag blue", "name": "Blue Flag" },
                            { "icon": "icomoon-man", "name": "Adult" }
                        ],
                        "Flag": "blue",
                        "CreationDate": "2020-05-03",
                        "LastLogin": "10 days ago",
                        "Courses": ["ENG4U-03", "ENG4U-03", "ENG4U-03", "ENG4U-03"]
                    },
                    {
                        "Id": 3,
                        "Name": "Jessica Hanson",
                        "Email": "jessica.hanson@example.com",
                        "Enabled": "true",
                        "Status": [
                            { "icon": "text", "name": "18+" },
                            { "icon": "icomoon-briefcase", "name": "Business" },
                            { "icon": "icomoon-flag green", "name": "Green Flag" },
                            { "icon": "icomoon-man", "name": "Adult" }
                        ],
                        "Flag": "green",
                        "CreationDate": "2020-05-03",
                        "LastLogin": "23 days ago",
                        "Courses": ["TYIOF-03", "ENG4U-03", "ENG4U-03", "ENG4U-03"]
                    },
                    {
                        "Id": 4,
                        "Name": "Jessica Hanson",
                        "Email": "jessica.hanson@example.com",
                        "Enabled": "false",
                        "Status": [
                            { "icon": "text", "name": "18+" },
                            { "icon": "icomoon-briefcase", "name": "Business" },
                            { "icon": "icomoon-flag green", "name": "Green Flag" },
                            { "icon": "icomoon-man", "name": "Adult" }
                        ],
                        "Flag": "green",
                        "CreationDate": "2020-05-03",
                        "LastLogin": "23 days ago",
                        "Courses": ["TYIOF-03", "ENG4U-03", "ENG4U-03", "ENG4U-03"]
                    }
                ];

                const usersPerPage = 2; // Number of users per page
                let currentPage = 1;
                let filteredUsers = [...users]; // Filtered list of users, initially contains all users
                let usersToDisplay = 10;

                // Function to display users with pagination
                function displayUsers(usersToDisplay, page, perPage) {
                    // Display the skeleton while changing pages
                    displaySkeleton(perPage);

                    // Simulate a short delay before displaying the paginated users
                    setTimeout(() => {
                        const userTableBody = document.querySelector('.responsive-table.users .responsive-table__body');
                        if (!userTableBody) {
                            console.error("Element .responsive-table.users .responsive-table__body not found.");
                            return;
                        }
                        userTableBody.innerHTML = ''; // Clear the table before adding new data

                        const start = (page - 1) * perPage;
                        const end = start + perPage;
                        const paginatedUsers = usersToDisplay.slice(start, end);

                        paginatedUsers.forEach(user => addUserRow(user));
                        const totalCountElement = document.getElementById('total-count-users');
                        if (!totalCountElement) {
                            console.error("Element #total-count-users not found.");
                            return;
                        }
                        totalCountElement.textContent = usersToDisplay.length;

                        // Add or remove the 'nonsearchresults' class based on the filtered count
                        const tableElement = document.querySelector('.responsive-table.users');
                        const countElement = document.querySelector('.total-count');
                        const controlPageElement = document.querySelector('.control-page');
                        const buttoEditRow = document.querySelector('.button-edit-row');
                        const errorElement = document.querySelector('.error');
                        if (!tableElement || !countElement || !controlPageElement) {
                            console.error("Required element(s) for displaying results not found.");
                            return;
                        }

                        if (usersToDisplay.length === 0) {
                            tableElement.classList.add('nonsearchresults');
                            countElement.classList.add('nonsearchresults');
                            controlPageElement.classList.add('nonsearchresults');
                            buttoEditRow.classList.add('nonsearchresults');
                            errorElement.classList.add('active');
                        } else {
                            tableElement.classList.remove('nonsearchresults');
                            countElement.classList.remove('nonsearchresults');
                            controlPageElement.classList.remove('nonsearchresults');
                            buttoEditRow.classList.remove('nonsearchresults');
                            errorElement.classList.remove('active');
                        }

                        // Update pagination controls
                        const prevPageButton = document.getElementById('prev-page');
                        const nextPageButton = document.getElementById('next-page');
                        const currentPageInput = document.getElementById('current-page');
                        if (prevPageButton && nextPageButton && currentPageInput) {
                            prevPageButton.classList.toggle('disabled', page === 1);
                            nextPageButton.classList.toggle('disabled', end >= usersToDisplay.length);
                            currentPageInput.value = page;
                        }

                        // Re-initialize the "Select all" functionality after rendering rows
                        initSelectAll();

                        // Initialize row selection and expand/collapse functionality
                        initRowInteractions();
                    }, 500); // Adjust the delay (500ms) as needed for the skeleton visibility
                }

                // Function to filter users
                function filterUsers() {
                    const search1Element = document.getElementById('users-search');
                    const search2Element = document.getElementById('users-search-1');
                    if (!search1Element || !search2Element) return;

                    const query1 = search1Element.value.toLowerCase();
                    const query2 = search2Element.value.toLowerCase();
                    const combinedQuery = `${query1} ${query2}`.trim();

                    const selectedStatuses = Array.from(document.querySelectorAll('#user-status .dropdown-option input[type="checkbox"]:checked')).map(cb => cb.value.toLowerCase());
                    const selectedCourses = Array.from(document.querySelectorAll('#user-courses .dropdown-option input[type="checkbox"]:checked')).map(cb => cb.value.toLowerCase());

                    const filteredUsersCount = users.filter(user => {
                        const matchesSearch = user.Name.toLowerCase().includes(combinedQuery) ||
                            user.Email.toLowerCase().includes(combinedQuery) ||
                            user.Courses.join(',').toLowerCase().includes(combinedQuery) ||
                            (combinedQuery === "true" && user.Enabled.toLowerCase() === "true") ||
                            (combinedQuery === "false" && user.Enabled.toLowerCase() === "false");

                        const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.every(status =>
                            user.Status.some(userStatus => userStatus.name.toLowerCase() === status)
                        );

                        const matchesCourses = selectedCourses.length === 0 || selectedCourses.every(course =>
                            user.Courses.map(c => c.toLowerCase()).includes(course)
                        );

                        return matchesSearch && matchesStatus && matchesCourses;
                    }).length;

                    displaySkeleton(Math.min(filteredUsersCount, usersPerPage));

                    setTimeout(() => {
                        filteredUsers = users.filter(user => {
                            const matchesSearch = user.Name.toLowerCase().includes(combinedQuery) ||
                                user.Email.toLowerCase().includes(combinedQuery) ||
                                user.Courses.join(',').toLowerCase().includes(combinedQuery) ||
                                (combinedQuery === "true" && user.Enabled.toLowerCase() === "true") ||
                                (combinedQuery === "false" && user.Enabled.toLowerCase() === "false");

                            const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.every(status =>
                                user.Status.some(userStatus => userStatus.name.toLowerCase() === status)
                            );

                            const matchesCourses = selectedCourses.length === 0 || selectedCourses.every(course =>
                                user.Courses.map(c => c.toLowerCase()).includes(course)
                            );

                            return matchesSearch && matchesStatus && matchesCourses;
                        });

                        currentPage = 1;
                        displayUsers(filteredUsers, currentPage, usersPerPage);
                    }, 500); // Adjust the delay (500ms) as needed for the skeleton visibility
                }

                // Function to search within dropdown options
                function setupDropdownSearch() {
                    const searchInput = document.getElementById('search-input');
                    const dropdownOptions = document.querySelectorAll('.dropdown-option');
                    const noResultsElement = document.getElementById('no-results');

                    if (!searchInput || !dropdownOptions || !noResultsElement) return;

                    searchInput.addEventListener('input', function() {
                        const searchTerm = searchInput.value.toLowerCase();
                        let hasResults = false;

                        dropdownOptions.forEach(option => {
                            const optionText = option.querySelector('.title').textContent.toLowerCase();
                            if (optionText.includes(searchTerm)) {
                                option.style.display = '';
                                hasResults = true;
                            } else {
                                option.style.display = 'none';
                            }
                        });

                        noResultsElement.style.display = hasResults ? 'none' : 'block';
                    });
                }

                // Attach event listeners
                const prevPageButton = document.getElementById('prev-page');
                const nextPageButton = document.getElementById('next-page');
                const currentPageInput = document.getElementById('current-page');

                if (prevPageButton) {
                    prevPageButton.addEventListener('click', function() {
                        if (currentPage > 1) {
                            currentPage--;
                            displayUsers(filteredUsers, currentPage, usersPerPage);
                        }
                    });
                }

                if (nextPageButton) {
                    nextPageButton.addEventListener('click', function() {
                        if (currentPage * usersPerPage < filteredUsers.length) {
                            currentPage++;
                            displayUsers(filteredUsers, currentPage, usersPerPage);
                        }
                    });
                }

                if (currentPageInput) {
                    currentPageInput.addEventListener('input', function() {
                        let pageNumber = parseInt(this.value);
                        if (pageNumber > 0 && pageNumber <= Math.ceil(filteredUsers.length / usersPerPage)) {
                            currentPage = pageNumber;
                            displayUsers(filteredUsers, currentPage, usersPerPage);
                        }
                    });
                }

                const usersSearch1Element = document.getElementById('users-search');
                const usersSearch2Element = document.getElementById('users-search-1');

                if (usersSearch1Element) {
                    usersSearch1Element.addEventListener('input', function() {
                        filterUsers();
                    });
                }

                if (usersSearch2Element) {
                    usersSearch2Element.addEventListener('input', function() {
                        filterUsers();
                    });
                }

                const statusCheckboxes = document.querySelectorAll('#user-status .dropdown-option input[type="checkbox"]');
                if (statusCheckboxes.length) {
                    statusCheckboxes.forEach(checkbox => {
                        checkbox.addEventListener('change', function() {
                            filterUsers();
                        });
                    });
                }

                const courseCheckboxes = document.querySelectorAll('#user-courses .dropdown-option input[type="checkbox"]');
                if (courseCheckboxes.length) {
                    courseCheckboxes.forEach(checkbox => {
                        checkbox.addEventListener('change', function() {
                            filterUsers();
                        });
                    });
                }

                // Simulate a long load time
                if (document.querySelector('.responsive-table.users')) {
                    setTimeout(() => {
                        displayUsers(filteredUsers, currentPage, usersPerPage);
                    }, 1000);
                }

                // Display skeleton during data loading with 10 skeleton rows initially
                if (document.querySelector('.responsive-table.users')) {
                    displaySkeleton(10);
                }

                // Initialize dropdown search functionality
                setupDropdownSearch();

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

                // Function to initialize row interactions (selection and expand/collapse)
                function initRowInteractions() {
                    const rowCheckboxes = document.querySelectorAll('.selectRow');
                    if (rowCheckboxes.length) {
                        rowCheckboxes.forEach(function(checkbox) {
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
                    }

                    const rows = document.querySelectorAll('.responsive-table__row');
                    if (rows.length) {
                        rows.forEach(function(row) {
                            row.addEventListener('click', function() {
                                this.classList.toggle('expanded');
                                updateBodyClass();
                            });
                        });
                    }
                }

                // Function to update body class based on row selection
                function updateBodyClass() {
                    var checkedItems = document.querySelectorAll('.selectRow:checked').length;

                    if (checkedItems === 0) {
                        console.log('Selected 0 items');
                        document.body.classList.remove('has-selected-rows', 'item-rows-1', 'item-rows-2');
                    } else if (checkedItems === 1) {
                        console.log('Selected 1 item');
                        document.body.classList.add('has-selected-rows', 'item-rows-1');
                        document.body.classList.remove('item-rows-2');
                    } else if (checkedItems >= 2) {
                        document.body.classList.add('has-selected-rows', 'item-rows-2');
                        document.body.classList.remove('item-rows-1');
                    }
                }

                // Adding a user row to the table
                function addUserRow(userData) {
                    const userTableBody = document.querySelector('.responsive-table.users .responsive-table__body');
                    if (!userTableBody) return;

                    const newRow = document.createElement('tr');
                    newRow.classList.add('responsive-table__row');

                    const nameCell = document.createElement('td');
                    nameCell.classList.add('responsive-table__body__text', 'main-item', 'responsive-table__body__text--name');
                    nameCell.innerHTML = `
        <label class="custom-checkbox">
            <input type="checkbox" class="selectRow">
            <span class="checkmark"></span>
        </label>
        <div class="main-item-holder">
            <div class="content">
                <span class="name pr">${userData.Name}</span>
            </div>
            <div class="content autor">
                <div class="d-flex flex-wrap icon-row">
                    ${userData.Status.map(status => status.icon === 'text' ? `<span class="icon" title="${status.name}">${status.name}</span>` : `<i class="icon ${status.icon}" title="${status.name}"></i>`).join('')}
                </div>
            </div>
        </div>
    `;

    const emailCell = document.createElement('td');
    emailCell.classList.add('responsive-table__body__text', 'responsive-table__body__text--status');
    emailCell.innerHTML = `
        <div class="mobile-holder">
            <div class="lebel-mobile">Contact info</div>
            <div class="email">${userData.Email}</div>
        </div>
    `;

    const statusCell = document.createElement('td');
    statusCell.classList.add('responsive-table__body__text', 'responsive-table__body__text--update', 'tablet-hide');
    statusCell.innerHTML = `
        <div class="mobile-holder">
            <div class="lebel-mobile">Instructor</div>
            <div class="d-flex flex-wrap icon-row">
                ${userData.Status.map(status => status.icon === 'text' ? `<span class="icon" title="${status.name}">${status.name}</span>` : `<i class="icon ${status.icon}" title="${status.name}"></i>`).join('')}
            </div>
        </div>
    `;

    const creationDateCell = document.createElement('td');
    creationDateCell.classList.add('responsive-table__body__text', 'responsive-table__body__text--country');
    creationDateCell.innerHTML = `
        <div class="mobile-holder">
            <div class="lebel-mobile">Creation Date/ Last Login</div>
            <div class="d-flex flex-wrap">
                <span class="pr">${userData.CreationDate}</span>
                <span class="secondary-text">${userData.LastLogin}</span>
            </div>
        </div>
    `;

    const coursesCell = document.createElement('td');
    coursesCell.classList.add('responsive-table__body__text', 'responsive-table__body__text--types');
    coursesCell.innerHTML = `
        <div class="mobile-holder">
            <div class="lebel-mobile">Courses</div>
            <div class="d-flex flex-wrap">
                ${userData.Courses.map(course => `<span class="main-title">${course}</span>`).join(',')}
            </div>
        </div>
    `;

    newRow.appendChild(nameCell);
    newRow.appendChild(emailCell);
    newRow.appendChild(statusCell);
    newRow.appendChild(creationDateCell);
    newRow.appendChild(coursesCell);

    userTableBody.appendChild(newRow);
}

// Display skeleton during data loading, based on the number of expected rows
function displaySkeleton(numRows) {
    const userTableBody = document.querySelector('.responsive-table.users .responsive-table__body');
    if (!userTableBody) return;

    userTableBody.innerHTML = ''; // Clear the table before adding the skeleton

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
        `;

        userTableBody.appendChild(skeletonRow);
    }
}
}
});