import Phaser from 'phaser';
import './style.css';

const WORLD_WIDTH = 1280;
const WORLD_HEIGHT = 720;

class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private started = false;
  private elapsedMinutes = 0;
  private clockElement!: HTMLElement;
  private messageElement!: HTMLElement;
  private lastHint = 0;

  constructor() {
    super('game');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#071018');
    this.drawWorld();

    this.player = this.add.rectangle(650, 420, 26, 34, 0xd8e6ee);
    this.player.setStrokeStyle(2, 0x657d8c);
    this.physics.add.existing(this.player);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(26, 34);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D') as Record<
      'W' | 'A' | 'S' | 'D',
      Phaser.Input.Keyboard.Key
    >;

    this.clockElement = document.querySelector('#clock') as HTMLElement;
    this.messageElement = document.querySelector('#message') as HTMLElement;

    const startButton = document.querySelector('#start-button') as HTMLButtonElement;
    startButton.addEventListener('click', () => this.startShift());

    this.scale.on('resize', () => this.fitCamera());
    this.fitCamera();
  }

  update(_: number, delta: number): void {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    if (!this.started) return;

    const speed = 220;
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;

    if (left) body.setVelocityX(-speed);
    if (right) body.setVelocityX(speed);
    if (up) body.setVelocityY(-speed);
    if (down) body.setVelocityY(speed);
    body.velocity.normalize().scale(speed);

    this.elapsedMinutes += delta / 1000 * 2.5;
    this.updateClock();

    const now = this.time.now;
    if (now - this.lastHint > 6000) {
      this.lastHint = now;
      this.showContextHint();
    }
  }

  private startShift(): void {
    this.started = true;
    (document.querySelector('#menu') as HTMLElement).hidden = true;
    (document.querySelector('#hud') as HTMLElement).hidden = false;
    this.showMessage('Die Schicht beginnt. Kontrolliere den Verkaufsraum.');
  }

  private updateClock(): void {
    const startMinutes = 22 * 60;
    const total = (startMinutes + Math.floor(this.elapsedMinutes)) % (24 * 60);
    const hours = Math.floor(total / 60).toString().padStart(2, '0');
    const minutes = (total % 60).toString().padStart(2, '0');
    this.clockElement.textContent = `${hours}:${minutes}`;
  }

  private showContextHint(): void {
    const x = this.player.x;
    const y = this.player.y;

    if (x < 390 && y < 330) {
      this.showMessage('Die Kasse ist leer. Noch ist kein Kunde da.');
    } else if (x > 950 && y < 330) {
      this.showMessage('Draußen flackert eine Lampe. Wahrscheinlich nur die Elektrik.');
    } else if (y > 560) {
      this.showMessage('Die Eingangstür ist verriegelt. Draußen ist es still.');
    }
  }

  private showMessage(text: string): void {
    this.messageElement.textContent = text;
    this.messageElement.hidden = false;
    this.time.delayedCall(3800, () => {
      this.messageElement.hidden = true;
    });
  }

  private fitCamera(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const zoom = Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
    this.cameras.main.setZoom(zoom);
    this.cameras.main.centerOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
  }

  private drawWorld(): void {
    const g = this.add.graphics();

    // Asphalt
    g.fillStyle(0x0a1118);
    g.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Lichtkegel außen
    g.fillStyle(0x233341, 0.35);
    g.fillCircle(1080, 150, 230);
    g.fillCircle(190, 160, 170);

    // Tankstelle
    g.fillStyle(0x17222b);
    g.fillRect(220, 120, 840, 500);
    g.lineStyle(5, 0x536774, 1);
    g.strokeRect(220, 120, 840, 500);

    // Boden
    g.fillStyle(0x27323a);
    g.fillRect(245, 145, 790, 450);

    // Fensterfront
    g.fillStyle(0x16303b);
    g.fillRect(250, 150, 760, 92);
    g.lineStyle(3, 0x6c8390, 0.75);
    for (let x = 250; x <= 1010; x += 152) {
      g.strokeRect(x, 150, 152, 92);
    }

    // Kasse
    g.fillStyle(0x4f4a3f);
    g.fillRect(290, 275, 210, 80);
    g.fillStyle(0x17191b);
    g.fillRect(335, 246, 75, 45);

    // Regale
    g.fillStyle(0x4a5358);
    g.fillRect(565, 300, 70, 210);
    g.fillRect(720, 300, 70, 210);
    g.fillStyle(0x2a3338);
    for (const x of [575, 730]) {
      for (let y = 325; y < 500; y += 48) {
        g.fillRect(x, y, 50, 10);
      }
    }

    // Kühlregale
    g.fillStyle(0x263f4c);
    g.fillRect(865, 275, 125, 220);
    g.lineStyle(2, 0x88a7b5, 0.5);
    g.strokeRect(865, 275, 125, 220);
    g.lineBetween(927, 275, 927, 495);

    // Eingang
    g.fillStyle(0x14262e);
    g.fillRect(570, 560, 140, 60);
    g.lineStyle(3, 0x7a909b);
    g.strokeRect(570, 560, 140, 60);

    // Zapfsäulen draußen
    for (const x of [80, 1120]) {
      g.fillStyle(0x26333b);
      g.fillRoundedRect(x, 320, 70, 130, 8);
      g.fillStyle(0x8b9ba4);
      g.fillRect(x + 16, 340, 38, 25);
      g.fillStyle(0x101418);
      g.fillRect(x + 20, 344, 30, 17);
    }

    // Markierungen
    g.fillStyle(0x9fb0ba);
    this.add.text(300, 315, 'KASSE', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#d8e4e9'
    });
    this.add.text(855, 510, 'GETRÄNKE', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#aebdc5'
    });
  }
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: WORLD_WIDTH,
  height: WORLD_HEIGHT,
  backgroundColor: '#071018',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [GameScene]
};

new Phaser.Game(config);
