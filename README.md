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

In a second terminal, sign in to Dev Tunnels and expose port 8000:

```powershell
devtunnel user login
devtunnel host -p 8000 --protocol http --allow-anonymous
```

Share the HTTPS URL printed by the tunnel command. `--allow-anonymous` makes the app and room relay accessible to anyone with that URL. Both the Node server and the tunnel process must remain running.
