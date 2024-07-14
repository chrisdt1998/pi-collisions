const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const context = canvas.getContext("2d");

const window_width = window.innerWidth;
const window_height = window.innerHeight;
canvas.width = window_width;
canvas.height = window_height;
canvas.style.background = "rgb(0, 0, 0)";

class Box {
    constructor(pos_x, pos_y, height, width, color, mass, velocity) {
        this.pos_x = pos_x;
        this.pos_y = pos_y;
        this.height = height;
        this.width = width;
        this.color = color;
        this.mass = mass;
        this.velocity = velocity;
        this.line_width = 5
    }

    draw(context) {
        context.beginPath();
        context.strokeStyle = this.color;
        context.lineWidth = this.line_width;
        context.rect(this.pos_x, this.pos_y, this.width, this.height);
        context.stroke();
        context.closePath();
    }

    update(time_delta) {
        this.pos_x += time_delta * this.velocity;
    }

    reverse(time_delta) {
        this.pos_x -= time_delta * this.velocity;
    }

    get momentum() {
        return this.mass * this.velocity;
    }

    get col_left() {
        return this.pos_x - this.line_width / 2;
    }

    get col_right() {
        return this.pos_x + this.width + this.line_width / 2;
    }
}

class Boundary {
    constructor(left, right, height, width, x, y, line_width) {
        this.left = left;
        this.right = right;
        this.height = height;
        this.width = width;
        this.x = x;
        this.y = y;
        this.line_width = line_width;
        this.col_left = this.left + this.line_width / 2;
        this.col_right = this.right - this.line_width / 2;
    }
    /**
     * 
     * @param {CanvasRenderingContext2D} context 
     */
    draw(context) {
        context.beginPath();
        context.strokeStyle = 'rgb(255, 255, 255)'
        context.lineWidth = this.line_width;
        // Base line
        context.moveTo(this.right, this.y + this.line_width);
        context.lineTo(this.left, this.y + this.line_width);
        // Left wall
        context.moveTo(this.left, this.y - this.height);
        context.lineTo(this.left, this.y + 3 * this.line_width/2);
        context.stroke();
        context.closePath();
    }
}

class PhysicsEngine {
    /**
     * 
     * @param {CanvasRenderingContext2D} context 
     */
    constructor(context) {
        this.big_box = new Box(300, 490, 90, 60, 'rgb(255, 0, 255)', 100000000, -0.1);
        this.small_box = new Box(200, 550, 30, 20, 'rgb(0, 255, 255)', 1, 0);
        this.boundary = new Boundary(100, 500, 200, 380, 380, 580, 5);
        this.context = context;
        this.velocity_of_approach = this.small_box.velocity - this.big_box.velocity;
        this.collisions_counter = 0;
        this.previous_time = null;
    }

    get momentum() {
        return this.big_box.momentum + this.small_box.momentum;
    }

    update_velocity_of_approach() {
        this.velocity_of_approach = this.small_box.velocity - this.big_box.velocity;
    }

    update_objects(time_delta) {
        this.big_box.update(time_delta);
        this.small_box.update(time_delta);
    }


    update_window() {
        this.context.clearRect(0, 0, window_width, window_height);
        this.big_box.draw(this.context);
        this.small_box.draw(this.context);
        this.boundary.draw(this.context);
        this.draw_collision_counter()
    }

    is_collided_blocks(obj1, obj2) {
        return obj1.col_left <= obj2.col_right;
    }

    is_collided_boundaries(boundary, obj) {
        return obj.col_left < boundary.col_left;
    }

    check_colisions(time_delta) {
        let collision_detected = false;
        if (this.is_collided_blocks(this.big_box, this.small_box)) {
            collision_detected = true;
            // Undo the move
            this.big_box.reverse(time_delta);
            this.small_box.reverse(time_delta);
            this.update_velocity_of_approach()

            // Compute the point time (or percent of the frame) where the boxes actually collided
            const time_of_collision = Math.abs((this.big_box.col_left - this.small_box.col_right) / this.velocity_of_approach);
            time_delta -= time_of_collision;

            // Compute the new velocities
            this.big_box.velocity = (this.momentum + (this.small_box.mass * this.velocity_of_approach)) / (this.big_box.mass + this.small_box.mass);
            this.small_box.velocity = this.big_box.velocity - this.velocity_of_approach;

            this.big_box.update(time_delta)
            this.small_box.update(time_delta);
            this.collisions_counter += 1;
        }
        if (this.is_collided_boundaries(this.boundary, this.small_box)) {
            collision_detected = true;
            // Undo the move
            this.small_box.reverse(time_delta);
            // Compute the point time (or percent of the frame) where the boxes actually collided
            const time_of_collision = Math.abs((this.small_box.col_left - this.boundary.col_left) / this.small_box.velocity);
            time_delta -= time_of_collision;
            
            this.small_box.velocity *= -1;
            this.small_box.update(time_delta)
            this.collisions_counter += 1;
        }
        if (collision_detected) {
            this.check_colisions(time_delta)
        }
    }

    draw_collision_counter() {
        context.fillStyle = 'white'; // Use fillStyle instead of strokeStyle
        context.font = '20px Arial';
        this.context.font = "20px Arial";
        this.context.fillText(`# Collisions ${this.collisions_counter}`, 400, 300);
    }

    run(time_stamp) {
        if (!this.previous_time) {
            this.previous_time = time_stamp;
        }
        const time_delta = time_stamp - this.previous_time;
        this.previous_time = time_stamp;
        // This is important and just for the first loop
        if (!this.previous_time || !time_stamp) {
            this.update_window();
            return;
        }
        this.update_objects(time_delta);
        this.check_colisions(time_delta);
        this.update_window();
    }
}

physics_engine = new PhysicsEngine(context);
function animation(time_stamp) {
    requestAnimationFrame(animation);
    physics_engine.run(time_stamp);
}

animation()