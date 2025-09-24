const ZONES = {
    meadow: { 
        name:'초원', 
        lv:[1,3], 
        enemies:[
            { name:'슬라임', hp:[6,9], atk:[1,2], def:[0,1], gold:[1,3], xp:[2,3] },
            { name:'들쥐',   hp:[7,10], atk:[1,3], def:[0,1], gold:[1,4], xp:[2,4] },
        ] 
    },
    forest: { 
        name:'숲', 
        lv:[3,6], 
        enemies:[
            { name:'늑대', hp:[12,18], atk:[2,4], def:[1,2], gold:[3,6], xp:[4,7] },
            { name:'덤불정령', hp:[14,20], atk:[2,5], def:[1,3], gold:[3,7], xp:[5,8] },
        ] 
    },
    ruin: { 
        name:'폐허', 
        lv:[6,99], 
        enemies:[
            { name:'망령', hp:[22,30], atk:[4,7], def:[2,4], gold:[6,10], xp:[8,12] },
            { name:'수호자', hp:[26,36], atk:[5,8], def:[3,5], gold:[7,12], xp:[10,14] },
        ] 
    },
};

class Mob
{
    constructor(type, name, hp, mp) 
    {    
        this.type = type;
        if(typeof name === "undefined")
        {
            this.name = "Unnamed"
        }
        if(typeof hp === "undefined") 
        {
            this. hp = 10; //최소 HP
        }
        if (typeof mp === "undefined") 
        {
            this.mp = 0;
        }

        //나중에 해당 부분은 json 가져와서 배정하는걸로
        switch (this.type) {
            case 'mouse':
                this.atk = 2;
                this.def = 2;
                this.spd = 2;
                break;
        
            default:
                this.atk = 1;
                this.def = 1;
                this.spd = 1;
                break;
        }
    }
    

    attack(target) {
        target.damage(this.atk - target.def);
    }

    damage(amount) {
        hp -= amount;

    }
}

class Monster extends Mob
{
    attack(target)
    {
        
    };
    damage()
    {

    };

};