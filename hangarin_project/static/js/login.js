document.addEventListener("DOMContentLoaded", () => {

    const card = document.querySelector(".login-card");
    const columns = document.querySelectorAll(".vertical");

    /*
     * =========================================
     * LOGIN CARD ANIMATION
     * =========================================
     */

    setTimeout(() => {
        if (card) {
            card.classList.add("show");
        }
    }, 400);


    /*
     * =========================================
     * BACKGROUND COLUMN ANIMATION
     * =========================================
     */

    const speeds = [
        18000,
        22000,
        26000,
        21000,
        24000,
        19000,
        23000,
        27000,
        20000,
        25000
    ];


    columns.forEach((column, index) => {

        const speed = speeds[index] || 22000;

        const direction = index % 2 === 0
            ? -1
            : 1;

        let position = direction === -1
            ? -900
            : -400;

        let lastTime = performance.now();


        function animate(time) {

            const delta = time - lastTime;

            lastTime = time;

            position += direction * (delta / speed) * 1000;

            /*
             * Keep the columns moving continuously.
             */

            if (position < -1200) {
                position = -350;
            }

            if (position > 100) {
                position = -1100;
            }

            column.style.transform =
                `translate3d(0, ${position}px, 0)`;

            requestAnimationFrame(animate);
        }


        requestAnimationFrame(animate);

    });


    /*
     * =========================================
     * PASSWORD ENTER KEY
     * =========================================
     */

    const password = document.querySelector("#id_password");

    if (password) {

        password.addEventListener("keydown", (event) => {

            if (event.key === "Enter") {

                const form =
                    document.querySelector(".login-form");

                if (form) {
                    form.requestSubmit();
                }

            }

        });

    }

});