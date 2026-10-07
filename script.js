"use strict";

/* =========================================
   PINVISION
   Pinterest-style AI image platform
========================================= */


/* =========================================
   SAMPLE DATA
========================================= */

const pins = [

    {
        id: 1,
        category: "Nature",
        title: "Mountain Dreams",
        image:
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85"
    },

    {
        id: 2,
        category: "Architecture",
        title: "Modern Architecture",
        image:
            "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=900&q=85"
    },

    {
        id: 3,
        category: "Anime",
        title: "Anime City",
        image:
            "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=85"
    },

    {
        id: 4,
        category: "Cars",
        title: "Midnight Drive",
        image:
            "https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=900&q=85"
    },

    {
        id: 5,
        category: "Fashion",
        title: "Street Fashion",
        image:
            "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85"
    },

    {
        id: 6,
        category: "Space",
        title: "Deep Space",
        image:
            "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=900&q=85"
    },

    {
        id: 7,
        category: "Architecture",
        title: "Minimal House",
        image:
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=85"
    },

    {
        id: 8,
        category: "Nature",
        title: "Forest Escape",
        image:
            "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=85"
    },

    {
        id: 9,
        category: "Gaming",
        title: "Gaming Setup",
        image:
            "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=900&q=85"
    },

    {
        id: 10,
        category: "Anime",
        title: "Dreamy Character",
        image:
            "https://images.unsplash.com/photo-1614583224978-f9a34c8e5d6c?auto=format&fit=crop&w=900&q=85"
    },

    {
        id: 11,
        category: "Space",
        title: "Galaxy",
        image:
            "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=85"
    },

    {
        id: 12,
        category: "Cars",
        title: "Luxury Machine",
        image:
            "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=900&q=85"
    }

];


/* =========================================
   ELEMENTS
========================================= */

const feed =
    document.getElementById("feed");

const searchInput =
    document.getElementById("searchInput");

const categories =
    document.querySelectorAll(".category");

const randomizeBtn =
    document.getElementById("randomizeBtn");

const modal =
    document.getElementById("createModal");

const openCreate =
    document.getElementById("openCreate");

const heroCreate =
    document.getElementById("heroCreate");

const createPanelBtn =
    document.getElementById("createPanelBtn");

const closeModal =
    document.getElementById("closeModal");

const promptInput =
    document.getElementById("promptInput");

const counter =
    document.getElementById("counter");

const generateBtn =
    document.getElementById("generateBtn");

const styleSelect =
    document.getElementById("styleSelect");

const ratioSelect =
    document.getElementById("ratioSelect");

const viewer =
    document.getElementById("viewer");

const viewerImage =
    document.getElementById("viewerImage");

const viewerTitle =
    document.getElementById("viewerTitle");

const viewerClose =
    document.getElementById("viewerClose");

const viewerBackdrop =
    document.getElementById("viewerBackdrop");

const viewerSave =
    document.getElementById("viewerSave");

const toast =
    document.getElementById("toast");

const toastText =
    document.getElementById("toastText");


let activeCategory = "All";

let currentViewerPin = null;


/* =========================================
   RENDER FEED
========================================= */

function renderFeed(list = pins) {

    feed.innerHTML = "";

    if (!list.length) {

        feed.innerHTML = `
            <div style="
                grid-column:1/-1;
                padding:60px;
                text-align:center;
                color:#888;
            ">
                <h3>No ideas found</h3>
                <p>Try another search.</p>
            </div>
        `;

        return;
    }


    list.forEach(pin => {

        const card =
            document.createElement("article");

        card.className =
            "pin";


        card.innerHTML = `

            <img
                src="${pin.image}"
                alt="${escapeHTML(pin.title)}"
                loading="lazy"
            >

            <div class="pin-overlay">

                <button
                    class="save-btn"
                    data-save="${pin.id}"
                >
                    Save
                </button>

                <div class="pin-bottom">

                    <span class="pin-title">
                        ${escapeHTML(pin.title)}
                    </span>

                    <button
                        class="like-btn"
                        data-like="${pin.id}"
                    >
                        ♡
                    </button>

                </div>

            </div>
        `;


        card
            .querySelector("img")
            .addEventListener(
                "click",
                () => openViewer(pin)
            );


        card
            .querySelector(
                `[data-save="${pin.id}"]`
            )
            .addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    savePin(pin);

                }
            );


        card
            .querySelector(
                `[data-like="${pin.id}"]`
            )
            .addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    const button =
                        event.currentTarget;

                    button.textContent =
                        button.textContent === "♡"
                            ? "♥"
                            : "♡";

                }
            );


        feed.appendChild(card);

    });

}


/* =========================================
   FILTER
========================================= */

function filterFeed() {

    const query =
        searchInput.value
            .trim()
            .toLowerCase();


    const filtered =
        pins.filter(pin => {

            const matchesCategory =
                activeCategory === "All" ||
                pin.category === activeCategory;


            const matchesSearch =
                !query ||
                pin.title
                    .toLowerCase()
                    .includes(query) ||
                pin.category
                    .toLowerCase()
                    .includes(query);


            return (
                matchesCategory &&
                matchesSearch
            );

        });


    renderFeed(filtered);

}


categories.forEach(category => {

    category.addEventListener(
        "click",
        () => {

            categories.forEach(
                item =>
                    item.classList.remove(
                        "active"
                    )
            );


            category.classList.add(
                "active"
            );


            activeCategory =
                category.dataset.category;


            filterFeed();

        }
    );

});


searchInput.addEventListener(
    "input",
    filterFeed
);


/* =========================================
   SHUFFLE
========================================= */

randomizeBtn.addEventListener(
    "click",
    () => {

        const shuffled =
            [...pins].sort(
                () => Math.random() - .5
            );

        renderFeed(shuffled);

        showToast(
            "Feed shuffled."
        );

    }
);


/* =========================================
   MODAL
========================================= */

function openModal() {

    modal.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";

    setTimeout(
        () => promptInput.focus(),
        100
    );

}


function closeCreateModal() {

    modal.classList.add(
        "hidden"
    );

    document.body.style.overflow =
        "";

}


openCreate.addEventListener(
    "click",
    openModal
);

heroCreate.addEventListener(
    "click",
    openModal
);

createPanelBtn.addEventListener(
    "click",
    openModal
);

closeModal.addEventListener(
    "click",
    closeCreateModal
);

document
    .querySelector(".modal-backdrop")
    .addEventListener(
        "click",
        closeCreateModal
    );


/* =========================================
   PROMPT COUNTER
========================================= */

promptInput.addEventListener(
    "input",
    () => {

        counter.textContent =
            `${promptInput.value.length} / 1000`;

    }
);


/* =========================================
   GENERATE
========================================= */

generateBtn.addEventListener(
    "click",
    generateImage
);


async function generateImage() {

    const prompt =
        promptInput.value.trim();


    if (!prompt) {

        showToast(
            "Enter a prompt first."
        );

        promptInput.focus();

        return;

    }


    generateBtn.disabled =
        true;

    generateBtn.textContent =
        "Creating...";


    try {

        /*
            SAFE API ARCHITECTURE

            Your secure backend should expose:

                POST /api/generate

            Body:

                {
                    prompt,
                    style,
                    ratio
                }

            Response:

                {
                    imageUrl
                }
        */


        const response =
            await fetch(
                "/api/generate",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        prompt,

                        style:
                            styleSelect.value,

                        ratio:
                            ratioSelect.value

                    })

                }
            );


        if (!response.ok) {

            throw new Error(
                "API unavailable"
            );

        }


        const data =
            await response.json();


        if (!data.imageUrl) {

            throw new Error(
                "No image returned"
            );

        }


        addGeneratedPin(
            data.imageUrl,
            prompt
        );


        closeCreateModal();


        showToast(
            "Your AI image was created!"
        );


    } catch (error) {

        console.error(error);

        /*
            The frontend cannot securely contain
            your OpenAI secret key.

            If /api/generate isn't connected,
            show a helpful message instead of
            exposing the key.
        */

        showToast(
            "Connect your secure image API."
        );

    } finally {

        generateBtn.disabled =
            false;

        generateBtn.textContent =
            "✦ Generate image";

    }

}


/* =========================================
   ADD GENERATED PIN
========================================= */

function addGeneratedPin(
    imageUrl,
    prompt
) {

    const newPin = {

        id:
            Date.now(),

        category:
            "AI Created",

        title:
            prompt.substring(
                0,
                55
            ),

        image:
            imageUrl

    };


    pins.unshift(
        newPin
    );


    renderFeed(
        pins
    );


    document
        .getElementById("feed")
        .scrollIntoView({
            behavior: "smooth"
        });

}


/* =========================================
   VIEWER
========================================= */

function openViewer(pin) {

    currentViewerPin =
        pin;

    viewerImage.src =
        pin.image;

    viewerTitle.textContent =
        pin.title;

    viewer.classList.remove(
        "hidden"
    );

    document.body.style.overflow =
        "hidden";

}


function closeViewer() {

    viewer.classList.add(
        "hidden"
    );

    document.body.style.overflow =
        "";

}


viewerClose.addEventListener(
    "click",
    closeViewer
);

viewerBackdrop.addEventListener(
    "click",
    closeViewer
);


viewerSave.addEventListener(
    "click",
    () => {

        if (
            currentViewerPin
        ) {

            savePin(
                currentViewerPin
            );

        }

    }
);


/* =========================================
   SAVE PIN
========================================= */

function getSaved() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "pinvision-saved"
            )
        ) || [];

    } catch {

        return [];

    }

}


function savePin(pin) {

    const saved =
        getSaved();


    const exists =
        saved.some(
            item =>
                item.id === pin.id
        );


    if (exists) {

        showToast(
            "Already saved."
        );

        return;

    }


    saved.push(
        pin
    );


    localStorage.setItem(
        "pinvision-saved",
        JSON.stringify(saved)
    );


    showToast(
        "Pin saved!"
    );

}


/* =========================================
   TOAST
========================================= */

function showToast(
    message
) {

    toastText.textContent =
        message;

    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.toastTimer
    );


    window.toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================
   KEYBOARD SHORTCUT
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            (event.ctrlKey ||
             event.metaKey) &&
            event.key.toLowerCase() === "k"
        ) {

            event.preventDefault();

            searchInput.focus();

        }


        if (
            event.key === "Escape"
        ) {

            closeCreateModal();

            closeViewer();

        }

    }
);


/* =========================================
   INITIALIZE
========================================= */

renderFeed();
