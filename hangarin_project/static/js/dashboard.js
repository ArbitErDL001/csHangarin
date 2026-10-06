document.addEventListener('DOMContentLoaded', function () {
    var backgroundImagePaths = [
        '/static/img/background.png',
        '/static/img/background2.jpg',
        '/static/img/background3.jpg',
        '/static/img/background4.jpg',
        '/static/img/background5.jpg'
    ];

    function preloadBackgroundImages() {
        return Promise.all(backgroundImagePaths.map(function (path) {
            return new Promise(function (resolve) {
                var image = new Image();
                image.onload = resolve;
                image.onerror = resolve;
                image.src = path;
            });
        }));
    }

    function finishLoading() {
        preloadBackgroundImages().then(function () {
            document.body.classList.remove('dashboard-loading');
        });
    }

    document.querySelectorAll('.messages').forEach(function (messageGroup) {
        window.setTimeout(function () {
            messageGroup.classList.add('is-dismissing');
            window.setTimeout(function () {
                messageGroup.remove();
            }, 350);
        }, 4000);
    });

    var themeToggle = document.querySelector('.theme-toggle');
    var themeOptions = document.querySelector('.theme-options');
    var themeChoices = document.querySelectorAll('.theme-option');
    var themes = ['nebula', 'forest', 'desert', 'sea', 'crimson', 'light'];

    function getSavedTheme() {
        try {
            return window.localStorage.getItem('hangarin-theme');
        } catch (error) {
            return null;
        }
    }

    function saveTheme(theme) {
        try {
            window.localStorage.setItem('hangarin-theme', theme);
        } catch (error) {
            return;
        }
    }

    function setTheme(theme) {
        if (themes.indexOf(theme) === -1) {
            theme = 'nebula';
        }

        document.documentElement.dataset.theme = theme;
        saveTheme(theme);

        themeChoices.forEach(function (choice) {
            choice.classList.toggle('is-selected', choice.dataset.theme === theme);
            choice.setAttribute('aria-checked', String(choice.dataset.theme === theme));
            choice.setAttribute('aria-pressed', String(choice.dataset.theme === theme));
        });
    }

    function toggleThemeOptions() {
        if (!themeToggle || !themeOptions) {
            return;
        }

        var isExpanded = themeToggle.getAttribute('aria-expanded') === 'true';
        themeToggle.setAttribute('aria-expanded', String(!isExpanded));
        themeOptions.hidden = isExpanded;
    }

    function replayCurrentTabIntro() {
        var currentPage = document.querySelector('.dashboard-content') || document.querySelector('.content');

        if (!currentPage || !window.gsap) {
            return;
        }

        var targets = currentPage.querySelectorAll(
            '.dashboard-header, .metric-card, .dashboard-panel, .page-title, '
            + '.search-toolbar, .sort-toolbar, .tab-card, .activity-row, '
            + 'tbody tr, .archive-item, .pagination'
        );

        animateElements(Array.from(targets));
    }

    var mobileSidebar = document.querySelector('.sidebar');
    var mobileSidebarToggle = document.querySelector('.sidebar-toggle');

    function syncMobileSidebarState() {
        if (!mobileSidebar || !mobileSidebarToggle) {
            return;
        }

        if (window.innerWidth <= 768) {
            var isExpanded = mobileSidebar.classList.contains('is-expanded');
            mobileSidebarToggle.setAttribute('aria-expanded', String(isExpanded));
            mobileSidebarToggle.setAttribute('aria-label', isExpanded ? 'Minimize sidebar' : 'Maximize sidebar');
            mobileSidebarToggle.textContent = 'ΛΞ';
            return;
        }

        mobileSidebar.classList.remove('is-expanded');
        mobileSidebarToggle.setAttribute('aria-expanded', 'false');
        mobileSidebarToggle.setAttribute('aria-label', 'Maximize sidebar');
        mobileSidebarToggle.textContent = 'ΛΞ';
    }

    if (mobileSidebar && mobileSidebarToggle) {
        mobileSidebarToggle.addEventListener('click', function () {
            if (window.innerWidth > 768) {
                return;
            }

            var shouldExpand = !mobileSidebar.classList.contains('is-expanded');
            mobileSidebar.classList.toggle('is-expanded', shouldExpand);
            syncMobileSidebarState();
        });

        window.addEventListener('resize', syncMobileSidebarState);
        syncMobileSidebarState();
    }

    var installButton = document.querySelector('#install-app');

    if (installButton) {
        var installAssets = [
            '/static/css/dashboard-clean.css',
            '/static/css/login.css',
            '/static/js/dashboard.js',
            '/static/js/login.js',
            '/static/img/icon-192.png',
            '/static/img/icon-512.png'
        ];
        var installCacheName = 'hangarin-static-v13';
        var installDownloadLabel = installButton.querySelector('.install-download-label');
        var installDownloadPercent = installButton.querySelector('.install-download-percent');
        var installDownloadRemaining = installButton.querySelector('.install-download-remaining');
        var installProgressTrack = installButton.querySelector('.install-progress-track');
        var installProgressFill = installButton.querySelector('.install-progress-fill');
        var installAssetsReady = false;
        var appInstalled = false;

        var isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true;

        if (isStandalone) {
            installButton.hidden = true;
        }

        window.addEventListener('appinstalled', function () {
            window.hangarinInstallPrompt = null;
            appInstalled = true;
            if (!installButton.disabled) {
                installButton.hidden = true;
            }
        });

        function setInstallProgress(loadedBytes, totalBytes, startedAt) {
            var percentage = Math.min(100, Math.floor((loadedBytes / totalBytes) * 100));
            var elapsedSeconds = Math.max((performance.now() - startedAt) / 1000, 0.1);
            var bytesPerSecond = loadedBytes / elapsedSeconds;
            var remainingSeconds = bytesPerSecond > 0
                ? Math.ceil((totalBytes - loadedBytes) / bytesPerSecond)
                : 0;

            installDownloadPercent.textContent = percentage + '%';
            installDownloadRemaining.textContent = remainingSeconds > 0
                ? remainingSeconds + 's remaining'
                : '';
            installProgressFill.style.width = percentage + '%';
            installProgressTrack.setAttribute('aria-valuenow', String(percentage));
            installButton.setAttribute('aria-label', 'Preparing app: ' + percentage + '%');
        }

        function downloadInstallAssets(signal) {
            return Promise.all(installAssets.map(function (assetUrl) {
                return fetch(assetUrl, { method: 'HEAD', cache: 'no-store', signal: signal })
                    .then(function (response) {
                        var size = Number(response.headers.get('content-length'));
                        if (!response.ok || !size) {
                            throw new Error('Unable to determine app asset size.');
                        }
                        return { url: assetUrl, size: size };
                    });
            })).then(function (assets) {
                var totalBytes = assets.reduce(function (total, asset) {
                    return total + asset.size;
                }, 0);
                var loadedBytes = 0;
                var startedAt = performance.now();
                var assetCachePromise = caches.open(installCacheName);

                setInstallProgress(0, totalBytes, startedAt);

                return Promise.all(assets.map(function (asset) {
                    return fetch(asset.url, {
                        cache: 'no-store',
                        headers: { 'X-Hangarin-Download': 'true' },
                        signal: signal
                    }).then(function (response) {
                        if (!response.ok || !response.body) {
                            throw new Error('Unable to download app assets.');
                        }

                        var responseForCache = response.clone();
                        var cacheWrite = assetCachePromise.then(function (cache) {
                            return cache.put(asset.url, responseForCache);
                        });
                        var reader = response.body.getReader();

                        function readNextChunk() {
                            return reader.read().then(function (result) {
                                if (result.done) {
                                    return cacheWrite;
                                }

                                loadedBytes += result.value.byteLength;
                                setInstallProgress(loadedBytes, totalBytes, startedAt);
                                return readNextChunk();
                            });
                        }

                        return readNextChunk();
                    });
                })).then(function () {
                    setInstallProgress(totalBytes, totalBytes, startedAt);
                    installAssetsReady = true;
                });
            });
        }

        function getInstallInstructions() {
            var isAppleMobile = /iPhone|iPad|iPod/.test(window.navigator.userAgent)
                || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
            return isAppleMobile
                ? 'Share > Add to Home Screen'
                : 'Browser menu > Install app';
        }

        function continueInstall() {
            var installPrompt = window.hangarinInstallPrompt;
            if (!installPrompt) {
                installDownloadRemaining.textContent = getInstallInstructions();
                installButton.setAttribute('aria-label', 'Download complete. ' + getInstallInstructions());
                return;
            }

            window.hangarinInstallPrompt = null;
            installButton.disabled = true;
            installDownloadRemaining.textContent = 'Opening install prompt';

            try {
                installPrompt.prompt();
            } catch (error) {
                installButton.disabled = false;
                installDownloadRemaining.textContent = getInstallInstructions();
                return;
            }

            installPrompt.userChoice.then(function (choice) {
                if (choice.outcome === 'accepted' || appInstalled) {
                    installButton.hidden = true;
                    return;
                }

                installButton.disabled = false;
                installDownloadRemaining.textContent = getInstallInstructions();
                installButton.setAttribute('aria-label', 'Download complete. ' + getInstallInstructions());
            }).catch(function () {
                installButton.disabled = false;
                installDownloadRemaining.textContent = getInstallInstructions();
            });
        }

        installButton.addEventListener('click', function () {
            if (installButton.disabled) {
                return;
            }

            if (installAssetsReady) {
                continueInstall();
                return;
            }

            installButton.disabled = true;
            installButton.classList.remove('is-download-complete');
            installButton.classList.remove('is-download-error');
            installButton.classList.add('is-downloading');
            installDownloadLabel.textContent = 'Preparing app';
            var abortController = new AbortController();

            downloadInstallAssets(abortController.signal).then(function () {
                if (appInstalled) {
                    installButton.hidden = true;
                    return;
                }

                installButton.classList.remove('is-downloading');
                installButton.classList.add('is-download-complete');
                installButton.disabled = false;
                installDownloadLabel.textContent = 'Download complete';
                installDownloadRemaining.textContent = 'Continue to install';
                installButton.setAttribute('aria-label', 'Download complete. Continue to install.');
            }).catch(function () {
                if (appInstalled) {
                    installButton.hidden = true;
                    return;
                }

                installButton.classList.remove('is-downloading');
                installButton.classList.add('is-download-error');
                installButton.disabled = false;
                installDownloadLabel.textContent = 'Download incomplete';
                installDownloadRemaining.textContent = 'Tap to retry';
                installButton.setAttribute('aria-label', 'Download incomplete. Tap to retry.');
            });
        });
    }

    setTheme(getSavedTheme() || 'nebula');

    if (themeToggle) {
        themeToggle.addEventListener('click', toggleThemeOptions);
    }
    themeChoices.forEach(function (choice) {
        choice.addEventListener('click', function () {
            setTheme(choice.dataset.theme);
            replayCurrentTabIntro();
            if (themeToggle && themeOptions) {
                themeToggle.setAttribute('aria-expanded', 'false');
                themeOptions.hidden = true;
            }
        });
    });

    var accountMenu = document.querySelector('.account-menu');
    var accountButton = accountMenu ? accountMenu.querySelector('.account-menu-button') : null;
    var accountPanel = accountMenu ? accountMenu.querySelector('.account-menu-panel') : null;

    function closeAccountMenu() {
        if (!accountMenu || !accountButton || !accountPanel) {
            return;
        }

        accountMenu.classList.remove('is-open');
        accountButton.setAttribute('aria-expanded', 'false');
        accountPanel.hidden = true;
    }

    if (accountButton && accountPanel) {
        accountButton.addEventListener('click', function () {
            var isOpen = !accountMenu.classList.contains('is-open');
            accountMenu.classList.toggle('is-open', isOpen);
            accountButton.setAttribute('aria-expanded', String(isOpen));
            accountPanel.hidden = !isOpen;

            if (isOpen) {
                accountPanel.querySelectorAll('.account-menu-link').forEach(function (link) {
                    link.getBoundingClientRect();
                });
            }
        });

        accountPanel.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', closeAccountMenu);
        });

        document.addEventListener('click', function (event) {
            if (!accountMenu.contains(event.target)) {
                closeAccountMenu();
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                closeAccountMenu();
            }
        });
    }

    var scrollStorageKey = 'hangarin-scroll:' + window.location.pathname;
    var savedScrollPosition = window.sessionStorage.getItem(scrollStorageKey);

    function navigateWithScroll(url) {
        window.sessionStorage.setItem(scrollStorageKey, String(window.scrollY));
        window.location.href = url;
    }

    if (savedScrollPosition !== null) {
        window.requestAnimationFrame(function () {
            window.requestAnimationFrame(function () {
                window.scrollTo(0, Number(savedScrollPosition));
                window.sessionStorage.removeItem(scrollStorageKey);
            });
        });
    }

    async function refreshPagination(event) {
        event.preventDefault();

        var link = event.currentTarget;
        if (!(link instanceof HTMLAnchorElement) || !link.href) {
            return;
        }

        var response;

        try {
            response = await fetch(link.href, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
        } catch (error) {
            navigateWithScroll(link.href);
            return;
        }

        if (!response.ok) {
            navigateWithScroll(link.href);
            return;
        }

        var html = await response.text();
        var parsed = new DOMParser().parseFromString(html, 'text/html');
        var currentTable = document.querySelector('.tab-card .table');
        var nextTable = parsed.querySelector('.tab-card .table');
        var currentFooter = document.querySelector('.tab-card .card-footer');
        var nextFooter = parsed.querySelector('.tab-card .card-footer');
        var currentArchive = document.querySelector('.archive-panel .archive-list');
        var nextArchive = parsed.querySelector('.archive-panel .archive-list');
        var updatedElements = [];
        if (currentTable && nextTable) {
            currentTable.querySelector('tbody').replaceWith(nextTable.querySelector('tbody'));
            if (currentFooter && nextFooter) {
                currentFooter.replaceWith(nextFooter);
            }
            updatedElements = Array.from(currentTable.querySelectorAll('tbody tr'));
        } else if (currentArchive && nextArchive) {
            currentArchive.innerHTML = nextArchive.innerHTML;
            updatedElements = Array.from(currentArchive.querySelectorAll('.archive-item'));
        }

        window.history.pushState({}, '', link.href);
        animateElements(updatedElements);
        bindPaginationLinks();
    }

    function bindPaginationLinks() {
        document.querySelectorAll('.pagination a.page-link[href]').forEach(function (link) {
            link.removeEventListener('click', refreshPagination);
            link.addEventListener('click', refreshPagination);
        });
    }

    bindPaginationLinks();

    var page = document.querySelector('.dashboard-content') || document.querySelector('.content');

    if (!page) {
        finishLoading();
        return;
    }

    function animateElements(elements) {
        if (!window.gsap || !elements.length) {
            return;
        }

        var timeline = window.gsap.timeline();
        timeline
            .set(elements, {
                opacity: 0,
                y: 22,
                scale: 0.96,
                transformOrigin: '50% 50%'
            })
            .to(elements, {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.4,
                stagger: 0.08,
                ease: 'back.out(1.7)',
                clearProps: 'transform'
            });
    }

    var pageAnimationTargets = page.querySelectorAll(
        '.dashboard-header, .metric-card, .dashboard-panel, .page-title, '
        + '.search-toolbar, .sort-toolbar, .tab-card, .activity-row, '
        + 'tbody tr, .archive-item, .pagination'
    );
    animateElements(Array.from(pageAnimationTargets));

    var progressBars = Array.from(page.querySelectorAll('.activity-progress-fill'));
    var progressValues = progressBars.map(function (bar) {
        return Number(bar.dataset.progress) || 0;
    });
    var maximumProgress = Math.max.apply(Math, progressValues.concat([1]));

    progressBars.forEach(function (bar, index) {
        var targetWidth = (progressValues[index] / maximumProgress) * 100;
        if (window.gsap) {
            window.gsap.fromTo(
                bar,
                { width: '0%' },
                { width: targetWidth + '%', duration: 0.65, delay: 0.35 + index * 0.08, ease: 'power1.out' }
            );
        } else {
            bar.style.width = targetWidth + '%';
        }
    });

    var donuts = Array.from(page.querySelectorAll('.donut[data-count]'));
    var donutTotal = donuts.reduce(function (total, donut) {
        return total + (Number(donut.dataset.count) || 0);
    }, 0);

    donuts.forEach(function (donut) {
        var count = Number(donut.dataset.count) || 0;
        var percentage = donutTotal ? (count / donutTotal) * 100 : 0;
        var color = donut.dataset.color || 'var(--color-blue)';
        donut.style.background = 'conic-gradient(' + color + ' 0 ' + percentage + '%, #363866 ' + percentage + '% 100%)';
    });

    document.querySelectorAll('[data-delete-animation]').forEach(function (form) {
        form.addEventListener('submit', function (event) {
            if (form.dataset.animationComplete === 'true') {
                return;
            }

            event.preventDefault();
            form.dataset.animationComplete = 'true';

            if (!window.gsap) {
                form.submit();
                return;
            }

            var itemName = form.closest('.card').querySelector('.delete-item-name');
            var title = itemName ? itemName.textContent.trim() : 'Deleted item';
            var sourceRect = itemName.getBoundingClientRect();
            var target = document.createElement('span');
            target.className = 'delete-trash-target';
            target.textContent = 'Trash';
            document.body.appendChild(target);

            var targetRect = target.getBoundingClientRect();
            var particles = Array.from(title.slice(0, 40)).map(function (letter, index) {
                var particle = document.createElement('span');
                var letterOffset = (sourceRect.width / Math.max(title.length, 1)) * index;
                particle.className = 'delete-letter';
                particle.textContent = letter === ' ' ? '\u00a0' : letter;
                particle.style.left = sourceRect.left + letterOffset + 'px';
                particle.style.top = sourceRect.top + sourceRect.height / 2 + 'px';
                document.body.appendChild(particle);
                return particle;
            });

            itemName.style.visibility = 'hidden';
            window.gsap.timeline({
                onComplete: function () {
                    target.remove();
                    particles.forEach(function (particle) {
                        particle.remove();
                    });
                    form.submit();
                }
            }).to(particles, {
                x: function () {
                    return targetRect.left - sourceRect.left;
                },
                y: function () {
                    return targetRect.top - sourceRect.top;
                },
                opacity: 0,
                scale: 0.15,
                rotation: function (index) {
                    return index % 2 ? 360 : -360;
                },
                duration: 0.9,
                stagger: 0.025,
                ease: 'power2.in'
            });
        });
    });

    finishLoading();

    document.querySelectorAll('.sidebar .nav-item a').forEach(function (link) {
        if (link.pathname === window.location.pathname) {
            link.setAttribute('aria-current', 'page');
        }
    });

});
