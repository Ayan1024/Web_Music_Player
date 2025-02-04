console.log("let's write js");

function secondsTominutesseconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00"; // Default for invalid input
  }
  let minutes = Math.floor(seconds / 60);
  let secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`; // Format as MM:SS
}

let songs = [];
let currfolder;
let currentsong = new Audio();
let isPlaying = false;

async function getsongs(folder) {
  currfolder = folder;
  let a = await fetch(`/${folder}/`);
  let response = await a.text();

  let div = document.createElement("div");
  div.innerHTML = response;
  let as = div.getElementsByTagName("a");

  songs = []; // Reset songs before updating

  for (let index = 0; index < as.length; index++) {
    const element = as[index];
    if (element.href.endsWith(".mp3")) {
      songs.push(decodeURIComponent(element.href.split(`/${folder}/`)[1])); // Decode URL encoding
    }
  }

  let songUL = document.querySelector(".songlist ul");
  songUL.innerHTML = ""; // Clear the song list before adding new songs

  for (const song of songs) {
    songUL.innerHTML += `
      <li>
        <img class="invert" src="img/music.svg" alt="" />
        <div class="info">
          <div>${song.replaceAll("%20", " ")}</div>
        </div>
        <div class="playnow">
          <img class="invert play-btn" src="img/play.svg" alt="" width="25px" />
        </div>
      </li>`;
  }

  // Attach event listeners to new song list items
  Array.from(document.querySelectorAll(".songlist li")).forEach((e) => {
    e.addEventListener("click", () => {
      let songName = e
        .querySelector(".info")
        .firstElementChild.innerHTML.trim();
      playMusic(songName);
    });
  });

  return songs; // Ensure the function returns updated songs
}

const playMusic = (track, pause = false) => {
  let songPath = `/${currfolder}/` + encodeURIComponent(track);
  let playButton = document.getElementById("play");

  document.querySelector(".songinfo").innerHTML = track;
  document.querySelector(".songtime").innerHTML = "00:00 / 00:00"; // Reset display

  if (currentsong.src.includes(songPath)) {
    if (!currentsong.paused) {
      currentsong.pause();
      isPlaying = false;
      if (playButton) playButton.src = "img/play.svg";
    } else {
      currentsong.play();
      isPlaying = true;
      if (playButton) playButton.src = "img/pause.svg";
    }
  } else {
    currentsong.src = songPath;
    isPlaying = !pause;
    if (!pause) currentsong.play();

    if (playButton) playButton.src = pause ? "img/play.svg" : "img/pause.svg";
  }

  currentsong.addEventListener("loadedmetadata", () => {
    document.querySelector(
      ".songtime"
    ).innerHTML = `<span>00:00</span> <span>${secondsTominutesseconds(
      currentsong.duration
    )}</span>`;
  });
};

async function displayalbum() {
  let a = await fetch(`/songs/`);
  let response = await a.text();
  
  let div = document.createElement("div");
  div.innerHTML = response;

  let anchor = div.getElementsByTagName("a");

  let cardcontainer = document.querySelector(".cardcontainer");
  if (!cardcontainer) {
    console.error("Card container not found in the DOM");
    return;
  }
let array = Array.from(anchor)

  cardcontainer.innerHTML = ""; // Clear before adding new cards

  for (let e of anchor) {
    let folder = e.href.split("/").slice(-2)[0];

    try {
      let a = await fetch(`/songs/${folder}/info.json`);
      let response = await a.json();

      cardcontainer.innerHTML += `
        <div data-folder="${folder}" class="card">
          <div class="play">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round"></path>
            </svg>
          </div>
          <img src="/songs/${folder}/cover.jpg" alt="" />
          <h2>${response.title}</h2>
          <p>${response.description}</p>
        </div>`;
    } catch (error) {
      console.error(`Error fetching info for ${folder}:`, error);
    }
  }

  // Attach event listeners to newly created cards
  document.querySelectorAll(".card").forEach(e => {
    e.addEventListener("click", async item => {
      songs = await getsongs(`songs/${item.currentTarget.dataset.folder}`);
      if (songs.length > 0) {
        playMusic(songs[0], true);
      }
    });
  });

}
async function main() {

  await displayalbum(); // Load albums before playing songs
  await getsongs("songs");

  if (songs.length > 0) {
    playMusic(songs[0], true);
  }

  await getsongs("songs");
  if (songs.length > 0) {
    playMusic(songs[0], true);
  }

  let playButton = document.getElementById("play");
  if (playButton) {
    playButton.addEventListener("click", () => {
      if (currentsong.paused) {
        currentsong.play();
        playButton.src = "img/pause.svg";
      } else {
        currentsong.pause();
        playButton.src = "img/play.svg";
      }
    });
  } else {
    console.warn("Play button with ID 'play' not found in the DOM!");
  }

  currentsong.addEventListener("ended", () => {
    if (playButton) playButton.src = "img/play.svg";
  });

  currentsong.addEventListener("timeupdate", () => {
    let songTimeElement = document.querySelector(".songtime");
    if (songTimeElement) {
      songTimeElement.innerHTML = `
        <span>${secondsTominutesseconds(currentsong.currentTime)}</span>
        <span>${secondsTominutesseconds(currentsong.duration)}</span>
      `;
      document.querySelector(".circle").style.left =
        (currentsong.currentTime / currentsong.duration) * 100 + "%";
    }
  });

  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let seekBar = e.target.getBoundingClientRect();
    let offsetX = e.offsetX;
    let percentage = (offsetX / seekBar.width) * 100;
    document.querySelector(".circle").style.left = percentage + "%";
    currentsong.currentTime = (currentsong.duration * percentage) / 100;
  });

  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-100%";
  });

  prevsong.addEventListener("click", () => {
    console.log("Previous button clicked");
    let songName = decodeURIComponent(currentsong.src.split("/").pop());
    let index = songs.indexOf(songName);
    if (index > 0) {
      playMusic(songs[index - 1]);
    } else {
      playMusic(songs[songs.length - 1]);
    }
  });

  nextsong.addEventListener("click", () => {
    console.log("Next button clicked");
    let songName = decodeURIComponent(currentsong.src.split("/").pop());
    let index = songs.indexOf(songName);
    if (index >= 0 && index < songs.length - 1) {
      playMusic(songs[index + 1]);
    } else {
      playMusic(songs[0]);
    }
  });

  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    e.addEventListener("click", async (item) => {
      songs = await getsongs(`songs/${item.currentTarget.dataset.folder}`);
      if (songs.length > 0) {
        playMusic(songs[0], true);
      }
    });
  });
}

main();
