document.addEventListener('DOMContentLoaded', function () {
    function finishLoading() {
        document.body.classList.remove('dashboard-loading');
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
    var themes = ['nebula', 'forest', 'desert', 'sea', 'crimson'];

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
        document.querySelectorAll('.pagination .page-link').forEach(function (link) {
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
