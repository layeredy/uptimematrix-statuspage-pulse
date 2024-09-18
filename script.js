function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

document.addEventListener('DOMContentLoaded', () => {
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Data file not found');
            }
            return response.json();
        })
        .then(data => {
            if (data.sections && data.sections.announcementBar) updateAnnouncementBar(data.announcement);
            updateOverallStatus(data.services, data);
            updateServices(data.services);
            if (data.sections && data.sections.maintenanceAlerts) updateMaintenanceAlerts(data.maintenanceAlerts);
            if (data.sections && data.sections.statusUpdates) updateStatusUpdates(data.statusUpdates);

            handleWhitelabel(data.Whitelabel);
        })
        .catch(error => {
            console.error('UptimeMatrix error:', error.message);
            displayErrorMessage();
        });

    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const savedTheme = getCookie('theme');

    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        updateThemeIcon();
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('light-mode');
        updateThemeIcon();
        setCookie('theme', body.classList.contains('light-mode') ? 'light' : 'dark', 365);
    });

    function updateThemeIcon() {
        const icon = themeToggle.querySelector('i');
        if (body.classList.contains('light-mode')) {
            icon.classList.remove('bi-moon-fill');
            icon.classList.add('bi-sun-fill');
        } else {
            icon.classList.remove('bi-sun-fill');
            icon.classList.add('bi-moon-fill');
        }
    }

    updateThemeIcon();
});

function displayErrorMessage() {
    const body = document.body;
    body.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <h1>Uh oh...</h1>
            <p>Something went wrong while loading this page</p>
            <p style="font-size: 0.8em;">Check your browser console for more</p>
        </div>
    `;
}

function updateAnnouncementBar(announcement) {
    const announcementBar = document.getElementById('announcement-bar');
    if (announcement && announcement.text) {
        announcementBar.textContent = announcement.text;
        announcementBar.style.display = 'block';
    } else {
        announcementBar.style.display = 'none';
    }
}

function updateOverallStatus(services, data) {
    const overallStatusElement = document.getElementById('overall-status');

    let isMaintenanceOngoing = false;
    if (data.maintenanceAlerts && data.maintenanceAlerts.length > 0) {
        const now = new Date();
        data.maintenanceAlerts.forEach(alert => {
            if (alert.start && alert.end) {
                const startTime = new Date(alert.start);
                const endTime = new Date(alert.end);
                if (now >= startTime && now <= endTime) {
                    isMaintenanceOngoing = true;
                }
            }
        });
    }

    if (isMaintenanceOngoing) {
        overallStatusElement.innerHTML = `
            <div class="status-icon">//</div>
            Undergoing maintenance
        `;
        overallStatusElement.className = 'status-maintenance';
        return;
    }

    let overallStatus = 'Operational';
    if (data.OverallStatus && data.OverallStatus !== 'NoOverride') {
        overallStatus = data.OverallStatus;
    } else {
        const allStatuses = Object.values(services).flatMap(group => Object.values(group));
        if (allStatuses.some(status => status === 'Issue')) {
            overallStatus = 'Issue';
        } else if (allStatuses.some(status => status === 'Degraded')) {
            overallStatus = 'Degraded';
        }
    }

    let statusText = 'All systems operational';
    let statusIcon = '✓';
    if (overallStatus === 'Degraded') {
        statusText = 'Some systems may be experiencing issues';
        statusIcon = '!';
    } else if (overallStatus === 'Issue') {
        statusText = 'Major outage detected';
        statusIcon = '✕'; // Cross mark for issue status
    } else if (overallStatus === 'Operational') {
        statusText = 'All systems operational';
        statusIcon = '✓';
    } else {
        statusText = overallStatus;
        statusIcon = '?'; 
    }

    overallStatusElement.innerHTML = `
        <div class="status-icon">${statusIcon}</div>
        ${statusText}
    `;
    overallStatusElement.className = `status-${overallStatus.toLowerCase()}`;

    const statusIconElement = overallStatusElement.querySelector('.status-icon');
    if (overallStatus === 'Operational') {
        statusIconElement.style.animation = 'blip 2s infinite';
    } else {
        statusIconElement.style.animation = 'none';
    }
}

function updateServices(services) {
    const servicesContainer = document.getElementById('services');
    servicesContainer.innerHTML = '<h2>Services</h2>';

    Object.entries(services).forEach(([groupName, serviceGroup]) => {
        const groupElement = document.createElement('div');
        groupElement.className = 'service-group';

        const groupStatus = calculateGroupStatus(serviceGroup);

        const groupTitle = document.createElement('h2');
        groupTitle.innerHTML = `
            <span class="dropdown-icon">▼</span>
            <span class="group-name">${groupName}</span>
            <span class="service-status status-${groupStatus.toLowerCase()}">${groupStatus}</span>
        `;
        groupElement.appendChild(groupTitle);

        const serviceList = document.createElement('div');
        serviceList.className = 'service-list';

        Object.entries(serviceGroup).forEach(([serviceName, status]) => {
            const serviceItem = document.createElement('div');
            serviceItem.className = 'service-item';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = serviceName;
            serviceItem.appendChild(nameSpan);

            const statusSpan = document.createElement('span');
            statusSpan.className = `service-status status-${status.toLowerCase()}`;
            statusSpan.textContent = status;
            serviceItem.appendChild(statusSpan);

            serviceList.appendChild(serviceItem);
        });

        groupElement.appendChild(serviceList);
        servicesContainer.appendChild(groupElement);

        groupTitle.addEventListener('click', () => {
            groupElement.classList.toggle('open');
        });
    });
}

function updateMaintenanceAlerts(alerts) {
    const maintenanceAlertsContainer = document.getElementById('maintenance-alerts');
    maintenanceAlertsContainer.innerHTML = '<h2>Maintenance Alerts</h2>';

    if (alerts && alerts.length > 0) {
        alerts.forEach(alert => {
            const alertElement = createAlertElement(alert, 'alert');
            maintenanceAlertsContainer.appendChild(alertElement);
        });
    } else {
        maintenanceAlertsContainer.innerHTML += '<p>No current maintenance alerts.</p>';
    }
}

function updateStatusUpdates(updates) {
    const statusUpdatesContainer = document.getElementById('status-updates');
    statusUpdatesContainer.innerHTML = '<h2>Status Updates</h2>';

    if (updates && updates.length > 0) {
        updates.forEach(update => {
            const updateElement = createAlertElement(update, 'update');
            if (update.color) {
                updateElement.style.setProperty('--status-update-color', update.color);
            }
            statusUpdatesContainer.appendChild(updateElement);
        });
    } else {
        statusUpdatesContainer.innerHTML += '<p>No recent status updates.</p>';
    }
}

function createAlertElement(item, className) {
    const element = document.createElement('div');
    element.className = className;

    const title = document.createElement('h3');
    title.textContent = item.title;
    element.appendChild(title);

    if (item.start && item.end) {
        const date = document.createElement('p');
        date.className = 'date';
        const startTime = new Date(item.start).toLocaleString();
        const endTime = new Date(item.end).toLocaleString();
        date.textContent = `From ${startTime} to ${endTime}`;
        element.appendChild(date);
    } else if (item.date) {
        const date = document.createElement('p');
        date.className = 'date';
        date.textContent = new Date(item.date).toLocaleString();
        element.appendChild(date);
    }

    const message = document.createElement('p');
    message.textContent = item.message;
    element.appendChild(message);

    return element;
}

function calculateGroupStatus(serviceGroup) {
    const statuses = Object.values(serviceGroup);
    if (statuses.every(status => status === 'Operational')) {
        return 'Operational';
    } else if (statuses.some(status => status === 'Issue')) {
        return 'Issue';
    } else {
        return 'Degraded';
    }
}

function handleWhitelabel(isWhitelabel) {
    const copyrightDiv = document.querySelector('.copyright');
    if (copyrightDiv) {
        copyrightDiv.style.display = isWhitelabel ? 'none' : 'block';
    }
}
