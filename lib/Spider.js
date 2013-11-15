/**
  *	本程序仅供学习使用
  * 作者：shuosuo
  * shuosuo@163.com
  */
function Spider() {
	this.cntr = $("#main");
	this.scoreElem = $("#score");
	this.stepElem = $("#step");
	this.paddingTop = 10;
	this.init();
}
Spider.prototype = {
	//初始化
	init: function() {
		var S = this;
		S.score = 500;
		S.step = 0;
		S.closeCollection = [];		//未发牌队列
		S.openCollection = [[],[],[],[],[],[],[],[],[],[]];		//已发牌队列,共10组
		S.doneCollection = [];		//已收牌队列
		S.readyCollection = [];		//牌堆
		S.historyQueue = [];  //保存操作历史记录
		S.distanceArr = [20, 20, 20, 20, 20, 20, 20, 20, 20, 20];		//牌纵向间距，每队记录一个当前值
	
		var i,j,_poker;
		//创建52*2张牌
		//pos  		所在位置   	0:预备位  1-10:游戏位置  11:已消除位置   -1:未初始化
		//style		花色	   	0:黑桃  1:红桃  2:梅花  3:方块  4:背面或占位符
		//num		牌大小		0-12  花色为4时:0表示背面;3表示占位符。花色为0-3时:表示A2345678910JQK
		for(i=0; i<4; i++){
			for(j=0; j<13; j++){
				var _mode = {};//牌有3个属性pos（放置位置），style（花色，背面，或者占位符），num（牌的点数）
				_mode.pos = -1;
				_mode.style = i;
				_mode.num = j;
				S.closeCollection.push(_mode);
				//2副牌
				var _mode2 = {};
				_mode2.pos = -1;
				_mode2.style = i;
				_mode2.num = j;
				S.closeCollection.push(_mode2);
			}
		}//将牌保存在closeCollection未发牌队列中

		//洗牌
		var tempArr = [];
		for(i=0,j=S.closeCollection.length; i<j; i++){
			var len = S.closeCollection.length;
			var index = Math.floor(Math.random()*len);
			var _poker = S.closeCollection.splice(index, 1)[0];
			tempArr.push(_poker);
		}
		S.closeCollection = tempArr;
		tempArr = [];
		var index = Math.floor(Math.random()*S.closeCollection.length-1/2) + 1;
		tempArr = S.closeCollection.splice(index, S.closeCollection.length/3);
		S.closeCollection = S.closeCollection.concat(tempArr);
		
		//创建占位符(共10个)
		for(i=0; i<10; i++){
			_poker = new Poker(S, {"pos": i+1, "style": 4, "num": 3});
			this.openCollection[i].push(_poker);
			//openCollection已发牌队列,共10组
		}
		
		//创建牌堆(共5个)
		for(i=0; i<5; i++){
			_poker = new Poker(S, {"pos": 0, "style": 4, "num": 0});
			_poker.offset((4-i)*10, 0);//offset,使用函数来设置所有匹配元素的偏移坐标
			//让5个牌堆有层次感，样式上好看
			_poker.elem.css("z-index", 900+i);
			S.readyCollection.push(_poker);
			//readyCollection牌堆
		}
	},
	start: function() {
		var S = this;
		S.record();//记录分数和步数
		//发牌
		var _delay = 0;//发牌动画的时间
		for(var i=0; i<6; i++){
			for(var j=0; j<10; j++){
				//从第6行第5列停止发牌
				if(i==5&&j==4){//控制发牌
					break;
				}
				//从5行第5列明牌显示，其他则为暗牌；
				var _mode = S.closeCollection.shift();
				//closeCollection 未发牌队列，每次从洗好的牌堆中的取第一张
				var _poker;
				var _pos = j+1;
				_mode.pos = _pos;
				if((i==4&&j>=4)||i==5){
					//从5行第5列明牌显示
					_poker = new Poker(S, _mode);//_mode已经有了自己的style，num属性,在创建52张牌时给的属性
					//此时style不等于4，所以这些牌打开开关（移除fixed）
				}else{
					//其他则为暗牌
					_poker = new Poker(S, {"pos": _pos, "style": 4, "num": 0});
				}
				var _offset = _poker.offset(0, 10*i);//偏移坐标，样式上好看，每排高度隔10px
				_poker.elem.css({"left": "990px", "top": "390px"});//被发的牌的位置
				//发牌动画
				_poker.moveTo(_offset.left, _offset.top, _delay);
				//这个动画在执行时，整个for循环已经遍历完，在等待动画处理
				
				S.openCollection[j].push(_poker);
				_poker.mode = _mode;
				_delay += 60;
			}
		}
		setTimeout(function() {
			var _poker = S.readyCollection[S.readyCollection.length-1];
			//readyCollection 牌堆
			_poker.enable();//最后一个牌堆，打开开关（移除fixed），此时牌堆上面可添加事件
		}, _delay);
	},
	//检测是否连贯
	continuous: function(poker, group) {
		var _group = group || this.openCollection[poker.mode.pos-1];
		var i = _group.length-1;
		do {
			var _poker1 = _group[i];//这列牌中的最后一张牌
			if(poker&&_poker1==poker){//如果移动的这张牌是最后一张牌
				return true;
			}
			var _poker2 = _group[i-1];//这列牌中倒数第二张牌
			if(_poker1.mode.style!=_poker2.mode.style||_poker1.mode.num!=_poker2.mode.num-1){
				//如果倒数第二张牌style不一样或者数字没有递减，则返回false
				return false;
			}
			if(!poker&&_poker2.mode.num==12){
				return i-1;
			}
			i--;
		}while(i>0);
		return false;
	},
	//发牌
	dealing: function(P) {
		var S = this;
		if(P.elem.is(".fixed")){
			return;
		}
		var _delay = 0;
		for(var i=0; i<10; i++){
			var _mode = S.closeCollection.shift();
			//shift() 方法用于把数组的第一个元素从其中删除，并返回第一个元素的值
			_mode.pos = i+1;
			var j = S.openCollection[i].length;
			//获取当前队列最后一张牌的纵坐标，新牌的纵坐标在此基础上+20px
			var _lastPoker = S.openCollection[i][j-1];
			var _offset = _lastPoker.soliOffset();//获取新发牌的位置
			_poker = new Poker(S, _mode);
			_poker.elem.css({"left": "990px", "top": "390px"});
			//发牌动画
			_poker.moveTo(_offset.left, _offset.top, _delay);
			_delay += 60;
			S.openCollection[i][j] = _poker;
		}
		setTimeout(function() {
			var _delPoker = S.readyCollection.pop();//发完一组牌后，减少一个牌堆
			_delPoker.elem.remove();
			_delPoker = null;
			if(S.readyCollection.length>0){
				var _poker = S.readyCollection[S.readyCollection.length-1];
				_poker.enable();
			}
		}, _delay);
		S.historyQueue.push("dealing");		//添加历史记录——“dealing"
	},
	//记录分数和移动步数
	record: function() {
		this.scoreElem.html(this.score);//this.scoreElem = $("#score");
		this.stepElem.html(this.step);//this.stepElem = $("#step");
	},
	//收牌
	folding: function(pos) {
		var S = this;
		var _group = S.openCollection[pos];
		var i = _group.length-1;
		var _poker = _group[i];
		if(_poker.mode.num!=0){//如果是背面直接返回
			return;
		}
		var index = S.continuous(null, _group);
		if(!index){
			return;
		}
		var _x = 50 + S.doneCollection.length*110;
		var _y = 390;
		var _delay = 0;
		for(; i>=index; i--){
			_poker = _group[i];
			_poker.elem.css("z-index", 900-i);
			_poker.disable();
			_poker.mode.pos = 11;
			_poker.moveTo(_x, _y, _delay);
			_delay += 5;
		}
		S.doneCollection.push(_group.splice(index));
		_poker = _group[index-1];
		if(_poker.elem.is(".fixed")){
			setTimeout(function() {
				_poker.expose();
			}, _delay);
		}
		S.score += 101;
		S.record();
		S.historyQueue[S.historyQueue.length-1].unshift({"pos": pos+1, "poker": "folding", "fixed": false});
		if(S.doneCollection.length==8){
			S.win();
		}
	},
	//调整间距
	adjustDistance: function(pos) {
		var S = this;
		var distance = 20;
		var _group = S.openCollection[pos];//牌所在的队列
		if(_group.length<3){//这一列的牌少于3张则不用调整间距
			return;
		}
		if(_group.length>18){
			distance = 360/(_group.length-5);//重新设置间距
			S.distanceArr[pos] = distance;
		}else{//如果牌在3-18之间，间距任然是20
			distance = 30;//distance修改为30？
			S.distanceArr[pos] = 20;
		}
		var _y = S.paddingTop;
		for(var i=1; i<_group.length; i++){
			var _poker = _group[i];
			if(_poker.elem.is(".fixed")){
				//如果是不能移动的则paddingTop+10px
				_y += 10;
			}else{
				_poker.elem.css("top", _y + "px");//设置可移动牌的paddingTop
				_y += distance;
			}
		}
	},
	//回退
	undo: function(S) {
		var len = S.historyQueue.length;
		if(len==0){//如果没有历史记录则返回
			return;
		}
		var historyArr = S.historyQueue.pop();
		//pop() 方法用于删除并返回数组的最后一个元素
		var i, _poker;
		//发牌历史---->直接将所有已发牌队列的最后一张牌移除，并恢复待发牌
		if(historyArr==="dealing"){
			for(i=9; i>=0; i--){
				_poker = S.openCollection[i].pop();
				var _mode = _poker.mode;
				_mode.pos = -1;
				S.closeCollection.unshift(_mode);
				_poker.elem.remove();
				S.adjustDistance(i);
			}
			_poker = new Poker(S, {"pos": 0, "style": 4, "num": 0});
			_poker.offset((4-S.readyCollection.length)*10, 0);
			_poker.elem.css("z-index", 900+S.closeCollection.length);
			S.readyCollection.push(_poker);
			_poker.enable();
			//重新设置一个牌堆
			if(S.readyCollection[S.readyCollection.length-2]){
				S.readyCollection[S.readyCollection.length-2].disable();
				//将原本打开点击事件的开关关上
			}
		}else{
			for(i=0; i<historyArr.length; i++){
				var _hy = historyArr[i];
				//检测翻牌历史，如果有，则将重新让翻转至背面
				if(_hy.fixed==true){
					_poker = _hy.poker;
					if(_poker.mode.style!=4||_poker.mode.num!=3){
						_poker.elem.css("background-position", "0px "+(-148*4)+"px");
						_poker.disable();
					}
				}else if(_hy.poker=="folding"){
				//检测收牌历史，如果有，则将收起的牌移回原队列
					var _group = S.doneCollection[S.doneCollection.length-1];
					var prevCollection = S.openCollection[_hy.pos-1];
					var _lastPoker = prevCollection[prevCollection.length-1];
					var _offset = _lastPoker.soliOffset();
					var _toX = _offset.left;
					var _toY = _offset.top;
					for(var j=0; j<_group.length; j++){
						_poker = _group[j];
						_poker.elem.css({
							"left": _toX + "px",
							"top": _toY + "px",
							"z-index": ""
						});
						_poker.enable();
						_toY += S.distanceArr[_hy.pos-1];
						_poker.elem.appendTo(S.cntr);
						_poker.mode.pos = _hy.pos;
						prevCollection.push(_poker);
					}
					S.doneCollection.pop();
					S.adjustDistance(_hy.pos-1);
				}else{
				//移牌历史处理
					_poker = _hy.poker;
					var prevCollection = S.openCollection[_hy.pos-1];
					var _lastPoker = prevCollection[prevCollection.length-1];
					var _offset = _lastPoker.soliOffset();
					_poker.elem.css({
						"left": _offset.left + "px",
						"top": _offset.top + "px"
					});
					_poker.elem.appendTo(S.cntr);
					prevCollection.push(_poker);
					S.openCollection[_poker.mode.pos-1].pop();
					S.adjustDistance(_poker.mode.pos-1);
					S.adjustDistance(_hy.pos-1);
					_poker.mode.pos = _hy.pos;
				}
			}
		}
	},
	//重新开始
	replay: function() {
		var S = this;
		$("#pop").hide();
		$(".poker").remove();
		S.init();//初始化
		S.start();
	},
	//显示胜利
	win: function() {
		$("#pop").delay(200).fadeIn();
	}
};
//创建占位符 Poker(S, {"pos": i+1(pos=1-10), "style": 4, "num": 3})
//创建牌堆 Poker(S, {"pos": 0, "style": 4, "num": 0})
//发背面牌 Poker(S, {"pos": _pos, "style": 4, "num": 0})
function Poker(S, mode) {
	this.S = S;
	this.elem = null;
	this.width = 105;
	this.height = 148;
	//pos  		所在位置   	0:预备位  1-10:游戏位置  11:已消除位置   -1:未初始化
	//style		花色	   	0:黑桃  1:红桃  2:梅花  3:方块  4:背面或占位符
	//num		牌大小		0-12  花色为4时:0表示背面;3表示占位符。花色为0-3时:表示A2345678910JQK
	this.mode = mode || {"pos": 0, "style": 4, "num": 0};
	this.init();
}
Poker.prototype = {
	init: function() {
		this.render();
		if(this.mode.style==4){//4:背面或占位符
			this.disable();
		}
		this.listener();
	},
	//给牌加上图片样式，和摆放位置
	render: function() {
		var P = this;
		var S = P.S;
		P.elem = $("<div class='poker'></div>");//创建一个牌元素
		var _css = {};
		_css["background-position"] = (-(P.width*P.mode.num))+"px "+(-(P.height*P.mode.style))+"px";
		//占位符样式  "style": 4,背面或占位符  "num": 3表示占位符
		if(P.mode.pos==0){
			//创建牌堆
			_css["left"] = "950px";
			_css["top"] = "390px";
		}else{
			//创建占位符 P.mode.pos=1-10
			_css["left"] = (50 + 110*P.mode.pos-110) + "px";
			_css["top"] = S.paddingTop + "px";//this.paddingTop = 10; S构造函数初始化属性
		}
		P.elem.css(_css);
		S.cntr.append(P.elem);//this.cntr = $("#main");
	},
	moveTo: function(x, y, delay) {
		var P = this;
		P.elem.delay(delay).animate({"left": x+"px", "top": y+"px"}, "fast");
	},
	offset: function(left, top) {
		left = left || 0;
		top = top || 0;
		var _left = parseInt(this.elem.css("left"));
		var _top = parseInt(this.elem.css("top"));
		this.elem.css({
			"left": (_left + left) + "px",
			"top": (_top + top) + "px"
		});
		return {"left": _left+left, "top": _top+top};
	},
	//获取队列中最后一张牌位置，并设置下一张的牌的位置
	soliOffset: function() {
		var P = this;
		var S = P.S;
		var _pos = P.mode.pos - 1;
		var _offset = P.offset();
		if(P.elem.is(".fixed")){
			_toY = _offset.top + 10;
			if(P.mode.style==4&&P.mode.num==3){//如果是占位符
				_toY = _offset.top;
			}
		}else{
			_toY = S.paddingTop + _offset.top + S.distanceArr[_pos];
		}
		return {
			"left": _offset.left,
			"top": _toY
		};
	},
	//fixed开关作用，存在时poker上的事件不执行
	disable: function() {
		this.elem.addClass("fixed");
	},
	enable: function() {
		this.elem.removeClass("fixed");
	},
	//翻牌
	expose: function() {
		var P = this;
		var S = P.S;
		if(P.mode.style==4&&P.mode.num==3){//如果是占位符则直接返回
			return;
		}
		P.enable();//牌可以移动
		P.elem.css("background-position", (-(P.width*P.mode.num))+"px "+(-(P.height*P.mode.style))+"px");
		//将牌背面设置为正面图片
		P.listener();
		//添加监听函数
		S.historyQueue[S.historyQueue.length-1].unshift({"pos": P.mode.pos, "poker": P, "fixed": true});
		//修改历史记录，这次行为不作为单独的一次操作，而是融入合并到上一步中
	},
	//事件侦听
	listener: function() {
		var P = this;
		var S = P.S;
		P.elem.unbind("click").unbind("mousedown");//移除事件
		if(P.mode.pos==0){
			//给创建的牌堆绑定点击函数
			P.elem.bind("click", function() {
				S.dealing(P);
			});
		}else if(P.mode.style!=4){
			P.elem.bind("mousedown", function(event) {//按下鼠标
				if(P.elem.is(".fixed")){
					return;
				}
				P.dragStart(P, event);
			});
		}
	},
	dragStart: function(P, event) {
		var S = P.S;
		if(S.moving===true){
			return;
		}
		if(!S.continuous(P)){//S.continuous(P)返回true则可以继续移动，false不能移动，不能移动时return中断
			return;
		}
		S.moving = true;

		//创建存放拖动牌元素的容器
		S.dragBox = $("<div class='drag_box'></div>").appendTo(S.cntr);
		var _css = {};
		_css["left"] = parseInt(P.elem.css("left"));
		_css["top"] = parseInt(P.elem.css("top"));
		//获取被拖动牌的位置
		_css["z-index"] = 999;
		//设置被拖动牌的层级为最高
		var _pos = P.mode.pos - 1;
		//找出点击牌所在队列
		var _group = S.openCollection[_pos];//找出点击牌所在队列组
		var _index = 99999;
		for(var i=0; i<_group.length; i++){
			var _poker = _group[i];
			var _top = parseInt(_poker.elem.css("top"));//获取队列组中牌的高度
			if(_poker==P){//判断点击牌是队列组中哪一张牌
				_index = i;
			}
			//将点击牌以及所在队列的后续牌元素放到dragBox中
			if(i>=_index){
				_poker.elem.css({"top": (_top-_css["top"])+"px", "left": "0px"});
				//给点击的牌设置css,若是最后一张牌，则为（left:0px,top:0px）,在左上角
				S.dragBox.append(_poker.elem);
			}
		}
		//将点击牌及所在队列的后续牌从openCollection移除，暂存到一个临时数组中
		S.dragCollection = _group.splice(_index);
		//记住点击牌所在队列的上一张牌
		S.soliPoker = _group[_index-1];
		//让存击拖动牌的窗口错位1*1px，以便用户感觉到鼠标已按下
		_css["left"] += 1;
		_css["top"] += 1;
		_css["left"] = _css["left"] + "px";
		_css["top"] = _css["top"] + "px";
		//还原点击牌的原来位置
		S.dragBox.css(_css);
		//记下牌的位置
		S.startX = event.pageX;
		S.startY = event.pageY;

		S.adjustDistance(_pos);//调整牌所在队列的间距，_pos点击牌所在队列

		//按下鼠标拖动元素
		$(document).bind("mousemove.drag", function(event) {
			P.draging(event, P);
		});
		//释放鼠标放置元素
		$(document).bind("mouseup.drag", function() {//mouseup.drag ???
			P.dragEnd(P);
		});
	},
	draging: function(event, P) {
		var S = P.S;
		var _moveX = event.pageX - S.startX;//S.startX原始位置
		var _moveY = event.pageY - S.startY;
		var _left = parseInt(S.dragBox.css("left"));
		var _top = parseInt(S.dragBox.css("top"));
		S.dragBox.css({
			"left": (_left + _moveX) + "px",
			"top": (_top + _moveY) + "px"
		});
		S.startX = event.pageX;
		S.startY = event.pageY;
	},
	dragEnd: function(P) {
		var S = P.S;
		var _left = parseInt(S.dragBox.css("left"));
		var _top = parseInt(S.dragBox.css("top")); 
		var _soliPoker, _poker;
		//根据x,y定位接龙位置
		for(var i=0; i<10; i++){
			_poker = S.openCollection[i][S.openCollection[i].length-1];//每一列中最后一张牌
			var _offset = _poker.offset();
			if(_left>_offset.left-50&&_left<_offset.left+105&&_top>_offset.top-50&&_top<_offset.top+105){
				//移动这张牌到每列最后一张牌的一个范围区间
				if((_poker.mode.style==4&&_poker.mode.num==3)||_poker.mode.num==(P.mode.num+1)){
					//判断如果这一列是占位符（没有牌）或者这张牌是这列最后一张牌的下一张
					_soliPoker = _poker;
				}
			}
		}
		_soliPoker = _soliPoker || S.soliPoker;//如果拖动正确则_soliPoker = _poker;否则依然是这列中最后一张牌
		
		var _pos = _soliPoker.mode.pos;//符合要求的队列
		var _soliOffset = _soliPoker.soliOffset(); //返回一个符合要求的位置
		var _toX = _soliOffset.left;//定义新的位置
		var _toY = _soliOffset.top;
		//通过动画移到新定义的位置上
		S.dragBox.animate({"left": _toX+"px", "top": _toY+"px"}, "fast", null, function() {
			var historyArr = [];	//历史记录
			S.moving = false; //一张牌没有移动完时，静止移动另外一张牌的开关，这里在移动完毕后打开移动开关
			for(var i=0; i<S.dragCollection.length; i++){
				_poker = S.dragCollection[i];
				//先保持移动以前的一个记录
				historyArr.push({"pos": _poker.mode.pos, "poker": _poker, "fixed": false});
				//保存完，再开始设置移动成功后的位置
				_poker.offset(_toX, _toY);
				_poker.mode.pos = _pos;
				S.cntr.append(_poker.elem);
				S.openCollection[_pos-1].push(_poker);
			}
			//记分,记录操作历史，判断是否翻牌
			if(_soliPoker!=S.soliPoker){//移动成功
				S.score -= 1;
				S.step += 1;
				S.record();//记录分数和移动步数
				S.historyQueue.push(historyArr); //将操作的记录放入历史记录中
				//翻牌
				if(S.soliPoker.elem.is(".fixed")){
					S.soliPoker.expose();//翻牌
				}
			}
			S.dragBox.remove();//移除创建存放拖动牌元素的容器
			S.dragCollection = [];//清空拖动存放数组
			S.folding(_pos-1);//判断移动成功的这一列是否完整可以收牌
			S.adjustDistance(_pos-1);//调整这一列的间距
		});
		$(document).unbind("mouseup.drag");
		$(document).bind("mousemove.drag");
	}
};
