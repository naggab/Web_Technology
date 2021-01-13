export class TimeTracker{

private t0 = 0;
private t1 = 0;
private timeSpent = 0;

private calcTime(){
    return this.t1 - this.t0;

}

public startTimer(){
    this.t0 = performance.now();
    return this.t0;
}

public stopTimer(){
    this.t1 = performance.now();
    this.timeSpent = this.calcTime();
    return this.timeSpent;
}

}