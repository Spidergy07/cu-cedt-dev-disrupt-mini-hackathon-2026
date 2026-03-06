// Scroll Effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.style.padding = '10px 5%';
        // header.style.background = 'rgba(5, 5, 8, 0.9)';
    } else {
        header.style.padding = '20px 5%';
        header.style.background = 'transparent';
    }
});

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', async () => {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if(mobileMenuBtn) {
        mobileMenuBtn.onclick = () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            if (navLinks.style.display === 'flex') {
                navLinks.style.position = 'absolute';
                navLinks.style.top = '70px';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.flexDirection = 'column';
                navLinks.style.background = 'var(--surface-color)';
                navLinks.style.padding = '20px';
                navLinks.style.zIndex = '1000';
            }
        };
    }

    // Dashboard Logic
    const dashboard = document.getElementById('pro-dashboard');
    if (!dashboard) return;

    let treeData = null;
    let currentPathStack = []; 
    // Format: [{node: node_obj, name: "Root"}]

    const sidebarNav = document.getElementById('sidebar-nav');
    const breadcrumbs = document.getElementById('pro-breadcrumbs');
    const contentArea = document.getElementById('pro-content');
    const fileCountLabel = document.getElementById('file-count');

    try {
        const res = await fetch('cedt_tree.json');
        if(!res.ok) throw new Error("JSON not found");
        treeData = await res.json();
    } catch (e) {
        console.error("Failed to load repo:", e);
        sidebarNav.innerHTML = `<li class="pro-sidebar-item"><i class="fas fa-exclamation-triangle text-danger"></i> Failed to load data</li>`;
        return;
    }

    // We start at the root
    currentPathStack = [treeData];

    function renderSidebar() {
        sidebarNav.innerHTML = '';
        
        // Let's get top level folders (Year 1-1, Year 1-2 etc.)
        const topLevelFolders = treeData.children.filter(c => c.type === 'folder' && c.name.startsWith('Year'));
        
        // Add "Home"
        const homeLi = document.createElement('li');
        homeLi.className = 'pro-sidebar-item';
        homeLi.innerHTML = `<i class="fas fa-home"></i> <span>Home Directory</span>`;
        homeLi.onclick = () => {
            document.querySelectorAll('.pro-sidebar-item').forEach(el => el.classList.remove('active'));
            homeLi.classList.add('active');
            navigateToRoot();
        };
        sidebarNav.appendChild(homeLi);
        
        // Add Years Menu
        topLevelFolders.forEach(yearFolder => {
            const li = document.createElement('li');
            li.className = 'pro-sidebar-item';
            li.innerHTML = `<i class="fas fa-folder"></i> <span>${yearFolder.name}</span>`;
            li.onclick = () => {
                document.querySelectorAll('.pro-sidebar-item').forEach(el => el.classList.remove('active'));
                li.classList.add('active');
                
                // Navigate directly to this folder
                currentPathStack = [treeData, yearFolder];
                renderView();
            };
            sidebarNav.appendChild(li);
        });
        
        // Active default
        homeLi.classList.add('active');
    }

    function navigateToRoot() {
        currentPathStack = [treeData];
        renderView();
    }

    function renderView() {
        renderBreadcrumbs();
        renderContent();
    }

    function renderBreadcrumbs() {
        breadcrumbs.innerHTML = '';
        
        currentPathStack.forEach((node, index) => {
            const isLast = (index === currentPathStack.length - 1);
            
            const step = document.createElement('div');
            step.className = 'pro-breadcrumb-step';
            
            let name = node.name === "CEDT Starter Kit" ? "Repository" : node.name;
            
            if (index === 0) {
                step.innerHTML = `<i class="fas fa-hdd" style="margin-right:8px;"></i> ${name}`;
            } else {
                step.innerText = name;
            }
            
            if (isLast) {
                step.style.color = 'var(--text-main)';
                step.style.cursor = 'default';
            } else {
                step.onclick = () => {
                    currentPathStack = currentPathStack.slice(0, index + 1);
                    renderView();
                };
            }
            
            breadcrumbs.appendChild(step);
            
            if (!isLast) {
                const sep = document.createElement('span');
                sep.className = 'pro-breadcrumb-sep';
                sep.innerHTML = '<i class="fas fa-chevron-right"></i>';
                breadcrumbs.appendChild(sep);
            }
        });
    }

    function getIcon(type) {
        if (type === 'folder') return { i: 'fa-folder', cls: 'folder' };
        if (type === 'pdf') return { i: 'fa-file-pdf', cls: 'pdf' };
        if (type === 'docx' || type === 'doc') return { i: 'fa-file-word', cls: 'docx' };
        if (type === 'zip' || type === 'rar') return { i: 'fa-file-archive', cls: 'default' };
        if (type === 'png' || type === 'jpg' || type === 'jpeg') return { i: 'fa-file-image', cls: 'default' };
        if (type === 'mp4' || type === 'mov') return { i: 'fa-file-video', cls: 'default' };
        return { i: 'fa-file-alt', cls: 'default' };
    }

    function renderContent() {
        contentArea.innerHTML = '';
        const currentNode = currentPathStack[currentPathStack.length - 1];
        
        if (!currentNode.children || currentNode.children.length === 0) {
            fileCountLabel.innerHTML = '0 items';
            contentArea.innerHTML = `
                <div class="pro-empty-state">
                    <i class="fas fa-ghost"></i>
                    <h2>This folder is empty</h2>
                    <p>There are no files or folders here yet.</p>
                </div>
            `;
            return;
        }

        // Sort: folders first
        const sortedChildren = [...currentNode.children].sort((a,b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return a.name.localeCompare(b.name);
        });

        fileCountLabel.innerHTML = `${sortedChildren.length} items`;

        sortedChildren.forEach(child => {
            const card = document.createElement('div');
            card.className = 'pro-file-card';
            
            const iconData = getIcon(child.type);
            
            card.innerHTML = `
                <div class="pro-file-icon ${iconData.cls}">
                    <i class="fas ${iconData.i}"></i>
                </div>
                <div class="pro-file-info">
                    <span class="pro-file-name" title="${child.name}">${child.name}</span>
                    <span class="pro-file-meta">${child.type === 'folder' ? 'Folder' : child.type.toUpperCase() + ' Document'}</span>
                </div>
            `;
            
            card.onclick = () => {
                if (child.type === 'folder') {
                    currentPathStack.push(child);
                    renderView();
                    // Scroll to top of content area on mobile
                    if (window.innerWidth <= 900) {
                        contentArea.scrollTop = 0;
                    }
                } else {
                    if (child.path) {
                        // Open the file exactly from the local path served by npx serve
                        const fileUrl = window.location.origin + '/' + encodeURI(child.path);
                        window.open(fileUrl, '_blank');
                    } else {
                        alert(`Cannot open ${child.name}: Invalid Path`);
                    }
                }
            };
            
            contentArea.appendChild(card);
        });
    }

    // Init
    renderSidebar();
    navigateToRoot();

});
