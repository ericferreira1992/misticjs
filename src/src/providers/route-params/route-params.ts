import { Injectable } from '../../inject/injectable';
import { Route } from '../../route/route';

@Injectable()
export class RouteParams {

    public route: Route;
    public parent: RouteParams;
    public data: { [key: string]: any } = {};
    public params: { [key: string]: any } = {};

    constructor(){
        
    }
}