# TimePass Arcade

## Run locally

Install the server dependency and start the site and multiplayer relay:

```powershell
npm install
npm start
```

Open [http://localhost:8000](http://localhost:8000). Multiplayer rooms use the Socket.IO relay included in this server; keep it running while players are connected.

The multiplayer lobby includes all 36 games. Pong, Tic-Tac-Toe, and Connect Four use their head-to-head rules; the remaining games run as live score/activity races. Players can finish a run to compare results.

## Share through a Dev Tunnel

For the easy setup, double-click `start-devtunnel.bat`. It starts the site server on port 8000 if needed, then opens the public tunnel. Keep both terminal windows open while friends are connected.

On first use, [install the Microsoft Dev Tunnels CLI](https://learn.microsoft.com/azure/developer/dev-tunnels/get-started) and sign in:

```powershell
devtunnel user login
```

The batch file runs `devtunnel host -p 8000 --protocol http --allow-anonymous`. Share the HTTPS URL it prints. Anonymous access makes the app and room relay accessible to anyone with that URL, so only expose this arcade site.
