// Do not modify this file, below; future versions will override this, use custom.js for your custom code.

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0)
            return c.substring(nameEQ.length, c.length);
    }
    return null;
}

document.addEventListener("DOMContentLoaded", () => {
    const startTime = performance.now();

    showLoadingAnimation();

    fetch(apiUrl)
        .then((response) => {
            if (!response.ok) {
                throw new Error(
                    "Database is unreachable/may be overloaded. \n\n\n\n -- No need to panic! -- \n--- What should I do? --- \n\n\n If you are a user: \n\n Please try again in a few minutes or check out our network status at status.uptimematrix.com \n\n\n If you are the site owner: \n\n Try re-checking in a few minutes or check your monitor configuration at app.uptimematrix.com if you are using a external database."
                );
            }
            return response.json();
        })
        .then((data) => {
            if (data.sections.announcementBar) {
                updateAnnouncementBar(data.announcement);
            } else {
                document.getElementById("announcement-bar").style.display = "none";
            }

            updateOverallStatus(
                data.services,
                data.RandomOperationalMessage,
                data
            );
            updateServices(data.services);
            if (data.sections.maintenanceAlerts)
                updateMaintenanceAlerts(data.maintenanceAlerts);
            if (data.sections.statusUpdates)
                updateStatusUpdates(data.statusUpdates);

            handleWhitelabel(data.Whitelabel);

            hideLoadingAnimation();

            const endTime = performance.now();
            const loadTime = (endTime - startTime).toFixed(2);
            console.log(
                `UptimeMatrix loaded successfully in ${loadTime}ms. UptimeMatrix by Layeredy LLC.`
            );
        })
        .catch((error) => {
            console.error("UptimeMatrix load failure!:", error.message);
            hideLoadingAnimation();
            displayErrorMessage();
            console.error(
                "--- What should I do? --- \n\n\n If you are a user: \n\n Please try again in a few minutes or check out our network status at status.uptimematrix.com \n\n\n If you are the site owner: \n\n Try re-checking in a few minutes or check your monitor configuration at app.uptimematrix.com if you are using a external database."
            );
        });

    const themeToggle = document.getElementById("theme-toggle");
    const body = document.body;
    const savedTheme = getCookie("theme");

    if (savedTheme === "light") {
        body.classList.add("light-mode");
        updateThemeIcon();
    }

    themeToggle.addEventListener("click", () => {
        body.classList.toggle("light-mode");
        updateThemeIcon();
        setCookie(
            "theme",
            body.classList.contains("light-mode") ? "light" : "dark",
            365
        );
    });

    function updateThemeIcon() {
        const icon = themeToggle.querySelector("i");
        if (body.classList.contains("light-mode")) {
            icon.classList.remove("bi-moon-fill");
            icon.classList.add("bi-sun-fill");
        } else {
            icon.classList.remove("bi-sun-fill");
            icon.classList.add("bi-moon-fill");
        }
    }

    updateThemeIcon();
});

function showLoadingAnimation() {
    const loadingElement = document.createElement("div");
    loadingElement.id = "loading-animation";
    loadingElement.innerHTML = `
        <div class="spinner"></div>
        <p>Loading...</p>
    `;
    document.body.appendChild(loadingElement);
}

function hideLoadingAnimation() {
    const loadingElement = document.getElementById("loading-animation");
    if (loadingElement) {
        loadingElement.parentNode.removeChild(loadingElement);
    }
}

function handleWhitelabel(isWhitelabel) {
    const copyrightDiv = document.querySelector(".copyright");
    if (copyrightDiv) {
        copyrightDiv.style.display = isWhitelabel ? "none" : "block";
    }
}

function displayErrorMessage() {
    const body = document.body;
    body.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <h1>Uh oh...</h1>
            <p>Something went really wrong while loading this status page </p>
            <p style="font-size: 0.8em;">Check if UptimeMatrix is having issues on our status page</p>
            <p style="font-size: 0.6em;">This error has been reported to UptimeMatrix and we are looking into it.</p>
            <br /> 
            <button onclick="window.location.href='https://status.uptimematrix.com'" style="padding: 10px 20px; background-color: #0275d8; color: #fff; border: none; border-radius: 5px; cursor: pointer;">
                UptimeMatrix status
            </button>
        </div>
    `;
}

function updateAnnouncementBar(announcement) {
    const announcementBar = document.getElementById("announcement-bar");
    if (announcement && announcement.text) {
        announcementBar.textContent = announcement.text;
        announcementBar.style.display = "block";
    } else {
        announcementBar.style.display = "none";
    }
}

function updateOverallStatus(services, RandomOperationalMessage, data) {
    const overallStatusElement = document.getElementById("overall-status");

    let overallStatus = "Operational";
    if (data.OverallStatus && data.OverallStatus !== "NoOverride") {
        overallStatus = data.OverallStatus;
    } else {
        const allStatuses = services.flatMap(category =>
            category.services.map(service => service.status)
        );
        if (allStatuses.some((status) => status === "Maintenance")) {
            overallStatus = "Maintenance";
        } else if (allStatuses.some((status) => status === "Issue")) {
            overallStatus = "Issue";
        } else if (allStatuses.some((status) => status === "Slow")) {
            overallStatus = "Slow";
        } else if (allStatuses.some((status) => status === "Degraded")) {
            overallStatus = "Degraded";
        } else {
            overallStatus = "Operational";
        }
    }

    let statusText = "";
    let statusIcon = "";

    if (overallStatus === "Maintenance") {
        statusText = "Undergoing maintenance";
        statusIcon = "//";
    } else if (overallStatus === "Issue") {
        statusText = "Major outage detected";
        statusIcon = "✕";
    } else if (overallStatus === "Slow") {
        statusText = "Some services may be slow";
        statusIcon = "…";
    } else if (overallStatus === "Degraded") {
        statusText = "Some systems may be experiencing issues";
        statusIcon = "!";
    } else if (overallStatus === "Operational") {
        if (RandomOperationalMessage) {
            const successMessages = [
                "All systems are operational",
                "Systems are functioning normally",
                "Services are running smoothly",
                "All systems are performing as expected",
                "All platforms are operational and responsive",
                "All systems are live",
            ];
            statusText =
                successMessages[Math.floor(Math.random() * successMessages.length)];
        } else {
            statusText = "All systems are operational";
        }
        statusIcon = "✓";
    } else {
        statusText = overallStatus;
        statusIcon = "?";
    }

    overallStatusElement.innerHTML = `
        <div class="status-icon">${statusIcon}</div>
        ${statusText}
    `;
    overallStatusElement.className = `status-${overallStatus.toLowerCase()}`;

    const statusIconElement = overallStatusElement.querySelector(
        ".status-icon"
    );
    if (overallStatus === "Operational") {
        statusIconElement.style.animation = "blip 2s infinite";
    } else {
        statusIconElement.style.animation = "none";
    }
}

function updateServices(services) {
    const servicesContainer = document.getElementById("services");
    servicesContainer.innerHTML = "<h2>Services</h2>";

    services.forEach((category) => {
        const groupName = category.categoryName;
        const serviceGroup = category.services;

        const groupElement = document.createElement("div");
        groupElement.className = "service-group";

        const groupStatus = calculateGroupStatus(serviceGroup);

        const groupTitle = document.createElement("h2");
        groupTitle.innerHTML = `
            <span class="dropdown-icon">▼</span>
            <span class="group-name">${groupName}</span>
            <span class="service-status status-${groupStatus.toLowerCase()}">${groupStatus}</span>
        `;
        groupElement.appendChild(groupTitle);

        const serviceList = document.createElement("div");
        serviceList.className = "service-list";

        serviceGroup.forEach((service) => {
            const serviceName = service.serviceName;
            const status = service.status;

            const serviceItem = document.createElement("div");
            serviceItem.className = "service-item";

            const nameSpan = document.createElement("span");
            nameSpan.textContent = serviceName;
            serviceItem.appendChild(nameSpan);

            const statusSpan = document.createElement("span");
            statusSpan.className = `service-status status-${status.toLowerCase()}`;
            statusSpan.textContent = status;
            serviceItem.appendChild(statusSpan);

            serviceList.appendChild(serviceItem);
        });

        groupElement.appendChild(serviceList);
        servicesContainer.appendChild(groupElement);

        groupTitle.addEventListener("click", () => {
            groupElement.classList.toggle("open");
        });
    });
}

function updateMaintenanceAlerts(alerts) {
    const maintenanceAlertsContainer = document.getElementById(
        "maintenance-alerts"
    );

    if (alerts && alerts.length > 0) {
        const headingText =
            alerts.length > 1
                ? "Upcoming maintenances:"
                : "Upcoming maintenance:";
        maintenanceAlertsContainer.innerHTML = `<h2>${headingText}</h2>`;

        alerts.forEach((alert) => {
            const alertElement = createAlertElement(alert, "alert");
            maintenanceAlertsContainer.appendChild(alertElement);
        });
    } else {
        maintenanceAlertsContainer.innerHTML =
            "<h2>No current upcoming maintenances.</h2>";
    }
}

function updateStatusUpdates(updates) {
    const statusUpdatesContainer = document.getElementById("status-updates");
    statusUpdatesContainer.innerHTML = "<h2>Status Updates</h2>";

    if (updates && updates.length > 0) {
        updates.forEach((update) => {
            const updateElement = createAlertElement(update, "update");
            if (update.color) {
                updateElement.style.setProperty(
                    "--status-update-color",
                    update.color
                );
            }
            statusUpdatesContainer.appendChild(updateElement);
        });
    } else {
        statusUpdatesContainer.innerHTML +=
            "<p>No recent status updates.</p>";
    }
}

function createAlertElement(item, className) {
    const element = document.createElement("div");
    element.className = className;

    const title = document.createElement("h3");
    title.textContent = item.title;
    element.appendChild(title);

    if (item.start && item.end) {
        const date = document.createElement("p");
        date.className = "date";
        const startTime = new Date(item.start).toLocaleString();
        const endTime = new Date(item.end).toLocaleString();
        date.textContent = `From ${startTime} to ${endTime}`;
        element.appendChild(date);
    } else if (item.date) {
        const date = document.createElement("p");
        date.className = "date";
        date.textContent = new Date(item.date).toLocaleString();
        element.appendChild(date);
    }

    const message = document.createElement("p");
    message.textContent = item.message;
    element.appendChild(message);

    return element;
}

function calculateGroupStatus(serviceGroup) {
    const statuses = serviceGroup.map(service => service.status);
    if (statuses.every((status) => status === "Operational")) {
        return "Operational";
    } else if (statuses.some((status) => status === "Maintenance")) {
        return "Maintenance";
    } else if (statuses.some((status) => status === "Issue")) {
        return "Issue";
    } else if (statuses.some((status) => status === "Slow")) {
        return "Slow";
    } else if (statuses.some((status) => status === "Degraded")) {
        return "Degraded";
    } else {
        return "Unknown";
    }
}
