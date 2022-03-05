var scene = new Phaser.Scene('Game');

scene.connected = false;

const PLAYING = 0; //Symbol('Playing');
const WAITING_FOR_PLAYERS = 1; //Symbol('Waiting');
const COUNT_DOWN = 2; //Symbol('CountDown');
const SPECTATING = 3;

scene.preload = () => {
    // Load all assets 
    scene.load.image('player', 'assets/sprites/player.png');
    scene.load.image('enemy', 'assets/sprites/enemy.png');
    scene.keys = {
        up: scene.input.keyboard.addKey('W'),
        down: scene.input.keyboard.addKey('S'),
        left: scene.input.keyboard.addKey('A'),
        right: scene.input.keyboard.addKey('D'),
        space: scene.input.keyboard.addKey('space'),
    }
    scene.score_text = scene.add.text(0, 0, 'Waiting For Players', {
        fontSize: 60,
        color: 'black',
    });
}

scene.create = () => {
    console.log('Start');
    Client.connect();
}

scene.update = () => {
    // Check if state is set 
    if(scene.state == null)
        return;

    // State set render the state 
    for(const [player_id, player] of Object.entries(scene.state.players)){
        player.obj.x = player.x
        player.obj.y = player.y
        if(player.obj.texture.key === '__MISSING'){
            if(player_id != scene.player_id){
                player.obj.setTexture('enemy');
            }else{
                player.obj.setTexture('player')
            }
        }
    }

    // Draw Text
    scene.draw_text();

    // Send keyboard input 
    keys = {
        up: scene.keys.up.isDown,
        down: scene.keys.down.isDown,
        left: scene.keys.left.isDown,
        right: scene.keys.right.isDown,
        space: scene.keys.space.isDown,
    }
    Client.socket.emit('movement', keys);
}

scene.draw_text = () => {
    console.log(scene.state.game_state);
    switch(scene.state.game_state){
        case PLAYING:
            scene.score_text.setText('Score: ' + scene.state.team_0_score + '-' + scene.state.team_1_score);
            break;
        case WAITING_FOR_PLAYERS:
            break;
        case COUNT_DOWN:
            scene.score_text.setText('T -' + Math.round(scene.state.time_left));
            break;
        case SPECTATING:
            scene.score_text.setText('Spectating');
    }
}

scene.update_state = (server_state) => {
    console.log(server_state);

    // Convert the state to client side 
    let new_state = {
        id: 0,
        team: 0,
        players: {},
        game_state: server_state.game_state,
        time_left: server_state.time_left,
        team_0_score: server_state.team_0_score,
        team_1_score: server_state.team_1_score,
    }

    for(var player_id in server_state.players) {
        // Check if player is already created 
        var obj;

        if(scene.state.players[player_id]){
            obj = scene.state.players[player_id].obj;
        } else {
            console.log('sprite', player_id);
            if(player_id == scene.player_id){
                obj = scene.add.sprite(-50, -50, 'player');
            }else{
                obj = scene.add.sprite(-50, -50, 'enemy')
            }
        }

        new_state.players[player_id] = {
            x: server_state.players[player_id].x,
            y: server_state.players[player_id].y,
            obj: obj
        }
    }

    if(new_state.players[scene.player_id].spectating)
        new_state.game_state = SPECTATING;

    // Check for deleted players 
    for(var player_id in scene.state.players){
        if(!new_state.players[player_id]){
            scene.state.players[player_id].obj.destroy(true);
        }
    }

    // Update the state 
    scene.state = new_state;
}

scene.state = {
    id: 0,
    players: {}
};

var config = {
    type: Phaser.AUTO,
    width: 1600,
    height: 800,
    scene: scene,
    backgroundColor: '#d5f5f7',
}

var game = new Phaser.Game(config);

