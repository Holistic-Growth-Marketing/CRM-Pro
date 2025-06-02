document.addEventListener('DOMContentLoaded', () => {
  const initialTabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'page-performance', label: 'Page Performance' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'forecast-trends', label: 'Forecast/Trends' },
    { key: 'competitors', label: 'Competitors' },
    { key: 'customers', label: 'Customers' },
    { key: 'partners', label: 'Partners' },
    { key: 'settings', label: 'Settings' },
  ];

  const defaultEndpoint = {
    id: '',
    name: '',
    url: '',
    type: 'REST',
    isEnabled: true,
  };

  // State variables
  let activeTabKey = initialTabs[0].key;
  let apiEndpoints = []; // Stores ApiEndpoint objects
  let editingEndpointId = null; // Stores ID of endpoint being edited, or null for new

  // DOM Elements
  const sidebarNavList = document.getElementById('sidebar-nav-list');
  const contentArea = document.querySelector('.content-area');
  const tabContents = {
    dashboard: document.getElementById('dashboard-content'),
    'page-performance': document.getElementById('page-performance-content'),
    revenue: document.getElementById('revenue-content'),
    'forecast-trends': document.getElementById('forecast-trends-content'),
    competitors: document.getElementById('competitors-content'),
    customers: document.getElementById('customers-content'),
    partners: document.getElementById('partners-content'),
    settings: document.getElementById('settings-content'),
    fallback: document.getElementById('fallback-content'),
  };

  // Settings Tab Elements
  const addNewEndpointBtn = document.getElementById('add-new-endpoint-btn');
  const apiEndpointsTableBody = document.getElementById('api-endpoints-table-body');
  const endpointsTable = document.querySelector('.endpoints-table');
  const noEndpointsMessage = document.getElementById('no-endpoints-message');

  // Endpoint Modal Elements
  const endpointModal = document.getElementById('endpoint-modal');
  const endpointForm = document.getElementById('endpoint-form');
  const endpointModalTitle = document.getElementById('endpoint-modal-title');
  const cancelEndpointModalBtn = document.getElementById('cancel-endpoint-modal-btn');
  const endpointIdInput = document.getElementById('endpoint-id');
  const endpointNameInput = document.getElementById('endpoint-name');
  const endpointUrlInput = document.getElementById('endpoint-url');
  const endpointTypeSelect = document.getElementById('endpoint-type');
  const endpointIsEnabledCheckbox = document.getElementById('endpoint-isEnabled');

  // Response Modal Elements
  const responseModal = document.getElementById('response-modal');
  const responseModalTitle = document.getElementById('response-modal-title');
  const responseLoadingIndicator = document.getElementById('response-loading-indicator');
  const apiResponseDataContent = document.getElementById('api-response-data-content');
  const closeResponseModalBtn = document.getElementById('close-response-modal-btn');

  // Dashboard Tab Elements
  const dashboardSetupMessageEl = document.getElementById('dashboard-setup-message');
  const dashboardControlsEl = document.querySelector('.dashboard-controls');
  const dashboardApiSelector = document.getElementById('dashboard-api-selector');
  const loadDashboardDataBtn = document.getElementById('load-dashboard-data-btn');
  const dashboardLoadingIndicator = document.getElementById('dashboard-loading-indicator');
  const dashboardErrorMesssageEl = document.getElementById('dashboard-error-message');
  const dashboardDataArea = document.getElementById('dashboard-data-area');
  const scorecardMetric1El = document.getElementById('scorecard-metric1');
  const scorecardMetric2El = document.getElementById('scorecard-metric2');
  const scorecardMetric3El = document.getElementById('scorecard-metric3');
  const dashboardTableContainer = document.getElementById('dashboard-table-container');
  const dashboardRawJsonDataEl = document.getElementById('dashboard-raw-json-data');


  // Initialization
  function init() {
    loadState(); // Load endpoints from localStorage
    renderSidebar();
    renderActiveTabContent();
    setupEventListeners();
  }

  function loadState() {
    const storedEndpoints = localStorage.getItem('apiEndpoints');
    if (storedEndpoints) {
      apiEndpoints = JSON.parse(storedEndpoints);
    }
    const storedActiveTab = localStorage.getItem('activeTabKey');
    if (storedActiveTab && initialTabs.some(t => t.key === storedActiveTab)) {
        activeTabKey = storedActiveTab;
    } else {
        activeTabKey = initialTabs[0].key;
    }
  }

  function saveEndpoints() {
    localStorage.setItem('apiEndpoints', JSON.stringify(apiEndpoints));
  }
  
  function saveActiveTab() {
    localStorage.setItem('activeTabKey', activeTabKey);
  }

  // Sidebar Rendering
  function renderSidebar() {
    sidebarNavList.innerHTML = ''; // Clear existing items
    initialTabs.forEach(tab => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.dataset.tabKey = tab.key;
      a.textContent = tab.label;
      if (tab.key === activeTabKey) {
        a.classList.add('active');
        contentArea.setAttribute('aria-labelledby', `tab-content-header-${tab.key}`);
      }
      a.addEventListener('click', (e) => {
        e.preventDefault();
        handleTabClick(tab.key);
      });
      li.appendChild(a);
      sidebarNavList.appendChild(li);
    });
  }

  // Tab Handling
  function handleTabClick(tabKey) {
    activeTabKey = tabKey;
    saveActiveTab();
    renderSidebar(); // Re-render to update active class
    renderActiveTabContent();
  }

  function renderActiveTabContent() {
    Object.values(tabContents).forEach(contentEl => {
      if (contentEl) contentEl.style.display = 'none';
    });

    const currentContentElement = tabContents[activeTabKey] || tabContents.fallback;
    if (currentContentElement) {
      currentContentElement.style.display = 'block';
      contentArea.setAttribute('aria-labelledby', `tab-content-header-${activeTabKey}`);
    }


    if (activeTabKey === 'settings') {
      renderApiEndpointsTable();
    } else if (activeTabKey === 'dashboard') {
      renderDashboard();
    }
  }

  // Settings Tab Logic
  function renderApiEndpointsTable() {
    apiEndpointsTableBody.innerHTML = ''; // Clear existing rows
    if (apiEndpoints.length === 0) {
      noEndpointsMessage.style.display = 'block';
      endpointsTable.style.display = 'none';
    } else {
      noEndpointsMessage.style.display = 'none';
      endpointsTable.style.display = 'table';
      apiEndpoints.forEach(ep => {
        const row = apiEndpointsTableBody.insertRow();
        row.insertCell().textContent = ep.name;
        row.insertCell().textContent = ep.url;
        row.insertCell().textContent = ep.type;

        const statusCell = row.insertCell();
        const statusSpan = document.createElement('span');
        statusSpan.textContent = ep.isEnabled ? 'Enabled' : 'Disabled';
        statusSpan.className = ep.isEnabled ? 'status-enabled' : 'status-disabled';
        statusCell.appendChild(statusSpan);

        const actionsCell = row.insertCell();
        actionsCell.className = 'action-buttons';
        
        const testBtn = document.createElement('button');
        testBtn.className = 'btn btn-info btn-sm';
        testBtn.textContent = 'Test';
        testBtn.setAttribute('aria-label', `Test ${ep.name}`);
        testBtn.addEventListener('click', () => handleTestEndpoint(ep));
        actionsCell.appendChild(testBtn);

        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-secondary btn-sm';
        editBtn.textContent = 'Edit';
        editBtn.setAttribute('aria-label', `Edit ${ep.name}`);
        editBtn.addEventListener('click', () => openModalForEdit(ep));
        actionsCell.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-sm';
        deleteBtn.textContent = 'Delete';
        deleteBtn.setAttribute('aria-label', `Delete ${ep.name}`);
        deleteBtn.addEventListener('click', () => handleDeleteEndpoint(ep.id));
        actionsCell.appendChild(deleteBtn);
      });
    }
  }

  function openModalForCreate() {
    editingEndpointId = null;
    endpointModalTitle.textContent = 'Add New Endpoint';
    endpointForm.reset(); // Reset form for new entry
    endpointIdInput.value = '';
    endpointTypeSelect.value = defaultEndpoint.type; // Set default type
    endpointIsEnabledCheckbox.checked = defaultEndpoint.isEnabled; // Set default enabled state
    endpointModal.style.display = 'flex';
    endpointNameInput.focus();
  }

  function openModalForEdit(endpoint) {
    editingEndpointId = endpoint.id;
    endpointModalTitle.textContent = 'Edit Endpoint';
    endpointForm.reset(); // Clear previous values first
    endpointIdInput.value = endpoint.id;
    endpointNameInput.value = endpoint.name;
    endpointUrlInput.value = endpoint.url;
    endpointTypeSelect.value = endpoint.type;
    endpointIsEnabledCheckbox.checked = endpoint.isEnabled;
    endpointModal.style.display = 'flex';
    endpointNameInput.focus();
  }

  function closeModal(modalElement) {
    if (modalElement) {
      modalElement.style.display = 'none';
    }
  }

  function handleSaveEndpoint(event) {
    event.preventDefault();
    const name = endpointNameInput.value.trim();
    const url = endpointUrlInput.value.trim();
    const type = endpointTypeSelect.value;
    const isEnabled = endpointIsEnabledCheckbox.checked;
    const id = endpointIdInput.value || `ep-${Date.now().toString()}`;

    if (!name || !url) {
        alert("Name and URL are required.");
        return;
    }

    const endpointData = { id, name, url, type, isEnabled };

    if (editingEndpointId) {
      apiEndpoints = apiEndpoints.map(ep => ep.id === editingEndpointId ? endpointData : ep);
    } else {
      apiEndpoints.push(endpointData);
    }
    saveEndpoints();
    renderApiEndpointsTable();
    closeModal(endpointModal);
  }

  function handleDeleteEndpoint(endpointId) {
    if (window.confirm('Are you sure you want to delete this endpoint?')) {
      apiEndpoints = apiEndpoints.filter(ep => ep.id !== endpointId);
      saveEndpoints();
      renderApiEndpointsTable();
      // If the deleted endpoint was selected for the dashboard, reset dashboard
      if (dashboardApiSelector.value === endpointId) {
        dashboardApiSelector.value = '';
        resetDashboardDisplay();
        renderDashboard(); // Re-render to update selector and messages
      }
    }
  }

  async function handleTestEndpoint(endpoint) {
    responseModalTitle.textContent = `API Response for: ${endpoint.name}`;
    apiResponseDataContent.textContent = '';
    responseLoadingIndicator.style.display = 'block';
    responseModal.style.display = 'flex';

    if (endpoint.type !== 'REST') {
      apiResponseDataContent.textContent = `Test functionality for ${endpoint.type} endpoints is not yet implemented.`;
      responseLoadingIndicator.style.display = 'none';
      return;
    }

    try {
      const response = await fetch(endpoint.url);
      const contentType = response.headers.get("content-type");
      let responseBodyText;

      if (contentType && contentType.includes("application/json")) {
        const jsonData = await response.json();
        responseBodyText = JSON.stringify(jsonData, null, 2);
      } else {
        responseBodyText = await response.text();
      }

      if (!response.ok) {
        apiResponseDataContent.textContent = `Error: ${response.status} ${response.statusText}\n\n${responseBodyText}`;
      } else {
        apiResponseDataContent.textContent = responseBodyText;
      }
    } catch (error) {
      console.error("API Test Error:", error);
      apiResponseDataContent.textContent = `Network Error: ${error.message}. Check browser console for more details and ensure CORS is configured on the server if this is a cross-origin request.`;
    } finally {
      responseLoadingIndicator.style.display = 'none';
    }
  }

  // Dashboard Tab Logic
  function renderDashboard() {
    const enabledRestEndpoints = apiEndpoints.filter(ep => ep.isEnabled && ep.type === 'REST');
    
    dashboardApiSelector.innerHTML = '<option value="">-- Select an Endpoint --</option>'; // Clear and add default
    enabledRestEndpoints.forEach(ep => {
        const option = document.createElement('option');
        option.value = ep.id;
        option.textContent = `${ep.name} (${ep.url})`;
        dashboardApiSelector.appendChild(option);
    });

    if (apiEndpoints.length === 0) {
        dashboardSetupMessageEl.innerHTML = `Please configure an API endpoint in the <button id="goto-settings-btn1" class="btn-link">Settings</button> tab to populate the dashboard.`;
        dashboardSetupMessageEl.style.display = 'block';
        dashboardControlsEl.style.display = 'none';
        document.getElementById('goto-settings-btn1')?.addEventListener('click', () => handleTabClick('settings'));
    } else if (enabledRestEndpoints.length === 0) {
        dashboardSetupMessageEl.innerHTML = `No enabled REST API endpoints available. Please enable or add a REST endpoint in <button id="goto-settings-btn2" class="btn-link">Settings</button>.`;
        dashboardSetupMessageEl.style.display = 'block';
        dashboardControlsEl.style.display = 'none';
        document.getElementById('goto-settings-btn2')?.addEventListener('click', () => handleTabClick('settings'));
    } else {
        dashboardSetupMessageEl.style.display = 'none';
        dashboardControlsEl.style.display = 'flex';
    }
    // Restore previously selected endpoint if it still exists
    const currentSelectedId = dashboardApiSelector.value;
    if (enabledRestEndpoints.some(ep => ep.id === currentSelectedId)) {
         loadDashboardDataBtn.disabled = false;
    } else {
        dashboardApiSelector.value = ''; // Clear selection if old one is gone
        loadDashboardDataBtn.disabled = true;
    }
  }
  
  function resetDashboardDisplay() {
      dashboardLoadingIndicator.style.display = 'none';
      dashboardErrorMesssageEl.style.display = 'none';
      dashboardDataArea.style.display = 'none';
      scorecardMetric1El.textContent = 'N/A';
      scorecardMetric2El.textContent = 'N/A';
      scorecardMetric3El.textContent = 'N/A';
      dashboardTableContainer.innerHTML = '';
      dashboardRawJsonDataEl.textContent = '';
      dashboardRawJsonDataEl.style.display = 'none';
  }

  function handleDashboardEndpointChange(event) {
    const selectedEndpointId = event.target.value;
    loadDashboardDataBtn.disabled = !selectedEndpointId;
    resetDashboardDisplay(); // Clear previous data when selection changes
  }

  function extractScorecardData(data) {
    const N_A = 'N/A';
    // Prioritize direct keys, then nested, then common fallbacks
    return {
      metric1: data?.metric1 ?? data?.value1 ?? data?.summary?.metric1 ?? data?.totalUsers ?? data?.kpi1 ?? N_A,
      metric2: data?.metric2 ?? data?.value2 ?? data?.summary?.metric2 ?? data?.revenue ?? data?.kpi2 ?? N_A,
      metric3: data?.metric3 ?? data?.value3 ?? data?.summary?.metric3 ?? data?.newSignups ?? data?.kpi3 ?? N_A,
    };
  }

  async function handleFetchDashboardData() {
    const selectedEndpointId = dashboardApiSelector.value;
    if (!selectedEndpointId) {
      dashboardErrorMesssageEl.textContent = "Please select an API endpoint first.";
      dashboardErrorMesssageEl.style.display = 'block';
      return;
    }
    const endpoint = apiEndpoints.find(ep => ep.id === selectedEndpointId);
    if (!endpoint) {
      dashboardErrorMesssageEl.textContent = "Selected API endpoint not found.";
      dashboardErrorMesssageEl.style.display = 'block';
      return;
    }

    resetDashboardDisplay();
    dashboardLoadingIndicator.style.display = 'block';
    loadDashboardDataBtn.disabled = true;
    loadDashboardDataBtn.textContent = 'Loading Data...';

    try {
      const response = await fetch(endpoint.url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      const data = await response.json();
      
      // Populate Scorecards
      const scorecardMetrics = extractScorecardData(data);
      scorecardMetric1El.textContent = scorecardMetrics.metric1;
      scorecardMetric2El.textContent = scorecardMetrics.metric2;
      scorecardMetric3El.textContent = scorecardMetrics.metric3;

      // Populate Table or Raw JSON
      dashboardTableContainer.innerHTML = ''; // Clear previous table
      dashboardRawJsonDataEl.style.display = 'none';

      if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
        const table = document.createElement('table');
        table.className = 'dashboard-table';
        const thead = table.createTHead();
        const tbody = table.createTBody();
        const headerRow = thead.insertRow();
        Object.keys(data[0]).forEach(key => {
          const th = document.createElement('th');
          th.textContent = key;
          headerRow.appendChild(th);
        });
        data.forEach(rowData => {
          const bodyRow = tbody.insertRow();
          Object.values(rowData).forEach(value => {
            const td = bodyRow.insertCell();
            td.textContent = (typeof value === 'object' && value !== null) ? JSON.stringify(value) : String(value);
          });
        });
        dashboardTableContainer.appendChild(table);
      } else if (typeof data === 'object' && data !== null) {
        dashboardRawJsonDataEl.textContent = JSON.stringify(data, null, 2);
        dashboardRawJsonDataEl.style.display = 'block';
         dashboardTableContainer.innerHTML = '<p>Data is not an array of objects. Raw JSON shown below.</p>';
      } else {
        dashboardTableContainer.innerHTML = '<p>No tabular data to display, or data format is not recognized.</p>';
      }
      dashboardDataArea.style.display = 'block';

    } catch (error) {
      console.error("Dashboard API Fetch Error:", error);
      dashboardErrorMesssageEl.textContent = `Failed to fetch dashboard data: ${error.message}. Check console.`;
      dashboardErrorMesssageEl.style.display = 'block';
    } finally {
      dashboardLoadingIndicator.style.display = 'none';
      loadDashboardDataBtn.disabled = false;
      loadDashboardDataBtn.textContent = 'Load Dashboard Data';
    }
  }
  
  // Event Listeners Setup
  function setupEventListeners() {
    // Settings tab
    if (addNewEndpointBtn) {
        addNewEndpointBtn.addEventListener('click', openModalForCreate);
    }
    if (endpointForm) {
        endpointForm.addEventListener('submit', handleSaveEndpoint);
    }
    if (cancelEndpointModalBtn) {
        cancelEndpointModalBtn.addEventListener('click', () => closeModal(endpointModal));
    }
    if (closeResponseModalBtn) {
        closeResponseModalBtn.addEventListener('click', () => closeModal(responseModal));
    }

    // Dashboard tab
    if(dashboardApiSelector) {
        dashboardApiSelector.addEventListener('change', handleDashboardEndpointChange);
    }
    if(loadDashboardDataBtn) {
        loadDashboardDataBtn.addEventListener('click', handleFetchDashboardData);
    }

    // Close modal on escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            if (endpointModal.style.display === 'flex') {
                closeModal(endpointModal);
            }
            if (responseModal.style.display === 'flex') {
                closeModal(responseModal);
            }
        }
    });
    
    // Close modal on overlay click
    [endpointModal, responseModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) { // Only if click is on overlay itself
                    closeModal(modal);
                }
            });
        }
    });
  }

  init();
});
