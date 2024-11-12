export class Animator{
    
    constructor(){                
        this.elements = [];        
        this.iterator_running = false;            
    }
    
    add_element(name, element){
        let setup = {'name': name, 'element': element, 'routes': {}}
        // if (name in this.elements){
        //     console.log(`[Animator::add_element] Key already exist = ${name}`);            
        // }

        this.elements[name] = setup;
    }

    add_route(element_name, route_name, prop, start, end, duration, repeat, callback){
        if (!(element_name in this.elements)){
            console.error("[Animator::add_animator_route] Element ${element_name} is missing");
            return;
        }

        let route = {   
                        'prop': prop, 
                        'startVal': start, 
                        'endVal': end, 
                        'finalStart': start,
                        'finalEnd': end,                             
                        'startTime': -1,                        
                        'duration': duration,                                               
                        'direction': 'forward',                                        
                        'repeatMode': repeat,
                        'started': false,
                        'delay': 0,
                        'callback': callback             
                    };
        
        this.elements[element_name].routes[route_name] = route;

    }

    start_route(element_name, route_name, delay){
        if (this._bad_route(element_name, route_name)){        
            return;
        }

        let element = this.elements[element_name].element;
        let prop = this.elements[element_name].routes[route_name].prop;        
        
        this.elements[element_name].routes[route_name].startVal = this._get_prop(element, prop);
        this.elements[element_name].routes[route_name].delay = delay;
        this.elements[element_name].routes[route_name].started = true;


        if (this.iterator_running == false){           
            this.play();            
        }
    }

    pause(){
        this.iterator_running = false;
    }

    play(){
        this.iterator_running = true;
        requestAnimationFrame(this._iteration_handler.bind(this));
    }

    _iteration_handler(timestamp){                        
        for (const [element_name, element_info] of Object.entries(this.elements)){
            for (const [route_name, route] of Object.entries(element_info.routes)){
                if (route.started == false){
                    continue;
                }

                if (route.startTime == -1){
                    route.startTime = timestamp;
                }
                
                if (route.delay > (timestamp - route.startTime)){
                    continue;
                }

                if (route.delay > 0){
                    route.delay = 0;
                    route.startTime = timestamp;
                }

                let progress = (timestamp - route.startTime) / route.duration;
    
                let finished = this._animate_route(element_name, route_name, progress);
                
                if (!(finished)){
                    continue;
                }

                if (route.repeatMode == "reverse"){                            
                    route.startTime = timestamp;
                            
                    if (route.direction == 'forward'){                            
                        route.endVal = route.finalStart;                            
                        route.direction = 'reverse';
                    } else {
                        route.endVal = route.finalEnd;
                        route.direction = 'forward';
                    }
                    route.startVal = this._get_prop(this.elements[element_name].element, route.prop);                            
                } else if (route.repeatMode == "repeat"){
                    route.startTime = timestamp;
                    route.startVal = route.finalStart;
                    route.endVal = route.finalEnd;
                } else {
                    if (route.callback != undefined){
                        route.callback(element_name, route_name);
                    }
                }
                        
                    
                
            }
        }

        if (this.iterator_running){
            requestAnimationFrame(this._iteration_handler.bind(this));
        }
    }

    _animate_route(element_name, route_name, progress){
        let finished = false;
        let element = this.elements[element_name].element;
        let route =  this.elements[element_name].routes[route_name];
        let prop = route.prop;        

        if (progress >= 1.0){
            progress = 1;
            finished = true;
        }
        
        let next = route.startVal + (route.endVal - route.startVal) * progress;

        this._set_prop(element, prop, next);   
        
        return finished;

    }

    _get_prop(element, prop){
        let str_value = '0px';
        if (prop == 'top'){
            str_value = element.style.top;
            return this._convert_px_to_int(str_value);            
        }

        if (prop == 'left'){
            str_value = element.style.left;
            return this._convert_px_to_int(str_value);
        }

        if (prop == 'width'){
            str_value = element.style.width;
            return this._convert_px_to_int(str_value);
        }

        if (prop == 'height'){
            str_value = element.style.height;
            return this._convert_px_to_int(str_value);            
        }

        if (prop == 'translateX'){
            str_value = element.style.transform;            
            return str_value;
        }

        if (prop == 'translateY'){
            str_value = element.style.transform;
            return str_value;
            
        }

    }

    _set_prop(element, prop, value){

        let str_value = String(value)+"px";

        if (prop == 'top'){
            element.style.top = str_value;
            return; 
        }

        if (prop == 'left'){
            element.style.left = str_value;
            return;
        }

        if (prop == 'width'){
            element.style.width = str_value;
            return;
        }

        if (prop == 'height'){
            element.style.height = str_value;
            return;
        }

        console.error('[Animator::_set_prop] Does not support Propert = ${prop}');
    }

    _convert_px_to_int(str_value){
        let l = str_value.length;
        return parseInt(str_value.substring(0,l-2));
    }

    _bad_route(element_name, route_name){
        if (!(element_name in this.elements)){
            console.error("[Animator::_get_route] No Such Element = ${element_name}");
            return null;
        }

        if (!(route_name in this.elements[element_name].routes)){
            console.error("[Animator::_get_route] No Such Route ${route_name} in Element ${element_name");
            return false;
        }

        
        return null;
    }
}