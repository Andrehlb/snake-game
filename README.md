# Contribution Snake

A responsive Snake game created as a subtle easter egg for
[Andrehlb's GitHub profile](https://github.com/Andrehlb).

The project uses only HTML, CSS and JavaScript. It has no framework, external
dependency, analytics, tracking or audio.

## Features

- Responsive Canvas board
- Arrow keys and W/A/S/D controls
- Touch-friendly directional pad
- Start, pause and restart actions
- Current score
- Dark premium interface with copper, burnt orange, gold and off-white accents
- Configurable return link to the GitHub profile

## Run locally

You can open `index.html` directly in a browser. To use a local static server,
run this command from the project directory:

```bash
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Return URL

The **Back to GitHub Profile** link reads the optional `return` query parameter:

```text
http://localhost:8000/?return=https://github.com/Andrehlb%23contribution-snake
```

If the parameter is absent or invalid, the game returns to:

```text
https://github.com/Andrehlb#contribution-snake
```

Only HTTP and HTTPS return URLs are accepted.

## Publish with GitHub Pages

After the repository is created on GitHub and its files are pushed:

1. Open the repository settings.
2. Select **Pages** under **Code and automation**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the publishing branch and the root folder.
5. Save and wait for GitHub Pages to publish the site.

The expected production address is:

```text
https://andrehlb.github.io/snake-game/
```

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move up | Arrow Up or W | Up button |
| Move down | Arrow Down or S | Down button |
| Move left | Arrow Left or A | Left button |
| Move right | Arrow Right or D | Right button |
| Pause or resume | Space or Pause button | Pause button |

## Privacy

The game runs entirely in the browser and does not collect or transmit user data.
