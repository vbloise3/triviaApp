import React, { Component } from 'react';
import './App.css';
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js'

import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import {
  Table,
  TableBody,
  TableRow,
  TableRowColumn,
} from 'material-ui/Table';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import {Dispatcher} from 'flux'

/*import injectTapEventPlugin from 'react-tap-event-plugin';*/


/*injectTapEventPlugin();*/
var TriviaDispatcher = new Dispatcher();

var UserStore = {
  username: null,
  idToken: null,
  totalCorrect: 0,
  totalAnswered: 0
};
var CurrentQuestionStore = {
  questionId: '1'
};

// Added this to keep selected answer as a state element 
var CurrentAnswerStore = {
  answerLoc: ''
};
//

TriviaDispatcher.register(function(payload) {
  if (payload.actionType === 'update-user') {
    UserStore.username = payload.username
    UserStore.idToken = payload.idToken;
    UserStore.totalCorrect = payload.totalCorrect;
    UserStore.totalAnswered = payload.totalAnswered
  }
  if (payload.actionType === 'change-question') {
    CurrentQuestionStore.questionId = payload.questionId;
  }
  if (payload.actionType === 'reset-user') {
    // update users table
    let apigClient = apigClientFactory.newClient();
    var that = this;
    var additionalParams = {
          headers: {
              Authorization: UserStore.idToken,
          }
    };
    apigClient.resetuserUserIdPost({user_id: UserStore.username}, {totalanswered: 0, totalcorrect: 0}, additionalParams).then( function(result){
      UserStore.totalAnswered = result.data.total_answered;
      UserStore.totalCorrect = result.data.total_correct;
      console.log("returned user: " + result.data.usersname + " returned total answered: " + result.data.total_answered + " returned total correct " + result.data.total_correct);
    });
  }
  if (payload.actionType === 'save-answer'){
     CurrentAnswerStore.answerLoc = payload.answer;
     console.log("payload: " + CurrentAnswerStore.answerLoc);
  } //
});

/*global apigClientFactory*/

var poolData = {
  UserPoolId: 'us-east-2_HqMyKkokN',
  ClientId: '49d8bfc7jp0qbikvvgl19dns6d'
};


class App extends Component {
  constructor(props) {
    super(props);
    let deviceWidthCss = "App-buttons";
    this.state = {
      currentQuestionId: CurrentQuestionStore.questionId,
      currentUser: UserStore.username,
      deviceWidthCss: deviceWidthCss,
      colorRows: true
    };

    var that = this;
    TriviaDispatcher.register(function (payload) {
      if (payload.actionType === 'change-question') {
        that.setState({
          currentQuestionId: payload.questionId
        });
      }

    });
    TriviaDispatcher.register(function (payload) {
      if (payload.actionType === 'update-user') {
        console.log('here');
        console.log(payload);
        that.setState({
          currentUser: payload.username,
        });
        console.log("user: " + UserStore.username);
      }
    });
  }

  componentDidMount() {
    // set mobile layout
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
        this.setState({deviceWidthCss: "App-name-mobile"});
    } else {
        this.setState({deviceWidthCss: "App-name"});
    }
  }

  render() {
    let userLogIn = null;
    if (this.state.currentUser) {
      userLogIn = <LoggedInUsernameDialog username={this.state.currentUser}/>;
    } else {
      userLogIn = <LoginDialog/>;
    }

    return (
      <MuiThemeProvider>
        <div className="App">
          <div className="App-header">
            <h1 className={this.state.deviceWidthCss}>Chalice Trivia</h1>
            <div className="App-buttons">
                <div className="App-button-placement">
                    {userLogIn}
                </div>
                <SignUpDialog/>
            </div>
          </div>
          <div className="App-intro">
            <QuestionWithAnswers questionId={this.state.currentQuestionId} colorRows={this.state.colorRows}/>
          </div>
        </div>
      </MuiThemeProvider>
    );
  }
}

class LoggedInUsernameDialog extends Component {
  state = {
    open: false,
    totalCorrect: 0,
    totalAnswered: 0
  };

  handleOpen = () => {
    this.setState({open: true});
  };

  handleClose = () => {
    this.setState({open: false});
  };

  // reset user's state
  handleReset = () => {
    TriviaDispatcher.dispatch({
      actionType: 'reset-user',
      username: this.props.username,
      idToken: UserStore.idToken,
      totalCorrect: 0,
      totalAnswered: 0
    });
    TriviaDispatcher.dispatch({
      actionType: 'change-question',
      questionId: '1'
    });

    this.handleClose();
  }
  // end reset user's state

  handleLogOut() {
    TriviaDispatcher.dispatch({
      actionType: 'update-user',
      username: null,
      idToken: null,
      totalCorrect: 0,
      totalAnswered: 0
    });
    TriviaDispatcher.dispatch({
      actionType: 'change-question',
      questionId: '1'
    });
    this.handleClose();
  }

  render() {
    const actions = [
      <FlatButton
        label="Close"
        primary={true}
        onClick={this.handleClose}
      />,
      <FlatButton
        label="Reset"
        primary={true}
        onClick={this.handleReset.bind(this)}
      />,
      <FlatButton
        label="Log Out"
        primary={true}
        onClick={this.handleLogOut.bind(this)}
      />
    ];

    let userTable =  (
      <Table>
      <TableBody displayRowCheckbox={false}>
        <TableRow>
          <TableRowColumn><b>Username</b></TableRowColumn>
          <TableRowColumn>{this.props.username}</TableRowColumn>
        </TableRow>
        <TableRow>
          <TableRowColumn><b>Total Correct</b></TableRowColumn>
          <TableRowColumn>{UserStore.totalCorrect}</TableRowColumn>
        </TableRow>
        <TableRow>
          <TableRowColumn><b>Total Answered</b></TableRowColumn>
          <TableRowColumn>{UserStore.totalAnswered}</TableRowColumn>
        </TableRow>
      </TableBody>
    </Table>
    );


    return (
      <div>
        <RaisedButton label={this.props.username} onClick={this.handleOpen} />
        <Dialog
          actions={actions}
          modal={true}
          open={this.state.open}
        >
          {userTable}
        </Dialog>
      </div>
    );
  }
}

class UsernamePasswordDialog extends Component {
  state = {
    open: false,
    username: null,
    password: null
  };
  name = '';

  handleOpen = () => {
    this.setState({open: true});
  };

  handleClose = () => {
    this.setState({open: false});
  };

  handleSubmit  = () => (e) => {
    let authenticationData = {
      Username: this.state.username,
      Password: this.state.password,
    };
    let authenticationDetails = new AuthenticationDetails(authenticationData);
    let userPool = new CognitoUserPool(poolData);
    let userData = {
      Username: this.state.username,
      Pool: userPool
    };
    let cognitoUser = new CognitoUser(userData);
    var that = this;
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (result) {
        console.log(result);
        let apigClient = apigClientFactory.newClient();
        let additionalParams = {
          headers: {
            Authorization: result.getIdToken().getJwtToken(),
          }
        };
        apigClient.userGet({}, null, additionalParams).then( function(user_result){
          console.log(user_result);
          TriviaDispatcher.dispatch({
            actionType: 'update-user',
            username: that.state.username,
            idToken: result.getIdToken().getJwtToken(),
            totalCorrect: user_result.data.total_correct,
            totalAnswered: user_result.data.total_answered
          });
          TriviaDispatcher.dispatch({
            actionType: 'change-question',
            questionId: that.getNextQuestion(user_result.data.answers)
          });
        }).catch( function(result) {
          console.log(result)
          // Add error callback code here.
        });
      },
      onFailure: function (err) {
        alert(err);
      },

    });
    this.handleClose();
  };

  handleUsernameChange(e) {
    this.setState({
      username: e.target.value
    });
  }

  handlePasswordChange(e) {
    this.setState({
      password: e.target.value
    });
  }

  render() {
    const actions = [
      <FlatButton
        label="Cancel"
        primary={true}
        /*onTouchTap={this.handleClose}*/
        onClick={this.handleClose}
      />,
      <FlatButton
        label="Submit"
        primary={true}
        /*onTouchTap={this.handleSubmit.bind(this)}*/
        onClick={this.handleSubmit(this)}
      />,
    ];

    return (
      <div>
        <RaisedButton label={this.name} onClick={this.handleOpen} />
        <Dialog
          title="Enter a username and password:"
          actions={actions}
          modal={true}
          open={this.state.open}
        >
          <TextField
            hintText="Username Field"
            floatingLabelText="Username"
            errorText="This field is required"
            onChange={this.handleUsernameChange.bind(this)}
          /><br />
          <TextField
            hintText="Password Field"
            floatingLabelText="Password"
            type="password"
            errorText="This field is required"
            onChange={this.handlePasswordChange.bind(this)}
          /><br />
        </Dialog>
      </div>
    );
  }
}
class SignUpDialog extends UsernamePasswordDialog {
  name = 'Sign Up';

  handleSubmit  = () => (e) => {
    let userPool = new CognitoUserPool(poolData);
    userPool.signUp(this.state.username, this.state.password, [], null, function (err, result) {
      if (err) {
        alert(err);
        return;
      }
      let cognitoUser = result.user;
      console.log('user name is ' + cognitoUser.getUsername());
    });
    this.handleClose();
  }
}

class LoginDialog extends UsernamePasswordDialog{
  name = 'Login';

  handleSubmit() {
  // Implemented in UsernamePasswordDialog
    /*let authenticationData = {
      Username: this.state.username,
      Password: this.state.password,
    };
    let authenticationDetails = new AuthenticationDetails(authenticationData);
    let userPool = new CognitoUserPool(poolData);
    let userData = {
      Username: this.state.username,
      Pool: userPool
    };
    let cognitoUser = new CognitoUser(userData);
    var that = this;
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (result) {
        console.log(result);
        let apigClient = apigClientFactory.newClient();
        let additionalParams = {
          headers: {
            Authorization: result.getIdToken().getJwtToken(),
          }
        };
        apigClient.userGet({}, null, additionalParams).then( function(user_result){
          console.log(user_result);
          TriviaDispatcher.dispatch({
            actionType: 'update-user',
            username: that.state.username,
            idToken: result.getIdToken().getJwtToken(),
            totalCorrect: user_result.data.total_correct,
            totalAnswered: user_result.data.total_answered
          });
          TriviaDispatcher.dispatch({
            actionType: 'change-question',
            questionId: that.getNextQuestion(user_result.data.answers)
          });
        }).catch( function(result) {
          console.log(result)
          // Add error callback code here.
        });
      },
      onFailure: function (err) {
        alert(err);
      },

    });
    this.handleClose();*/
  }

  getNextQuestion(userAnswers) {
    let highestId = '0';
    var questionsAnsweredArray = Object.keys(userAnswers);
    for (var i = 0; i < questionsAnsweredArray.length; i++) {
      if (questionsAnsweredArray[i] > highestId) {
        highestId = questionsAnsweredArray[i];
      }
    }
    return +highestId + 1;
  }
}


class QuestionWithAnswers extends Component {
  constructor(props) {
    super(props);
    this.state = {
      question: '',
      answers: [],
      questionId: null
    };
    this.getQuestion(this.props.questionId);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return ((nextState.questionId !== this.state.questionId) || (nextProps.questionId !== this.props.questionId));
  }

  componentWillUpdate(nextProps, nextState) {
    this.getQuestion(nextProps.questionId);
  }

  /* componentDidUpdate() {
    console.log("QuestionWithAnswers shouldComponentUpdate: this.props.questionId: " + this.props.questionId);
    if ( (this.props.questionId === 1) ) {
       this.forceUpdate();
    }
  } */

  getQuestion(questionId) {
    let apigClient = apigClientFactory.newClient();
    var that = this;
    apigClient.questionsQuestionIdGet({question_id: questionId}).then( function(result){
        that.setState(
          {
            question: result.data.question,
            answers: result.data.possible_answers,
            questionId: result.data.question_id
          }
        );
      }).catch( function(result) {
        if (result.data.Code === 'NotFoundError') {
          alert('There are no more questions left. Thanks for playing!');
        }
        console.log(result)
        // Add error callback code here.
      });
  }

  render() {
    return (
      <div>
        <Question question={this.state.question}/>
        <Answers answers={this.state.answers} questionId={this.props.questionId} colorRows={this.props.colorRows}/>
      </div>
    );
  }
}


class Question extends Component {
  render() {
    return <p>{this.props.question}</p>
  }
}


class Answers extends Component {

  state = {
    selected: [-1],
    correctAnswer: null,
    selectedAnswer: null,
    isCorrect: null,
    colorRows: "#FFFFFF"
  };

  isSelected = (index) => {
    return this.state.selected.indexOf(index) !== -1;
  };

  handleRowSelection = (selectedRows) => {
    this.setState({
      selected: selectedRows,
    });
    TriviaDispatcher.dispatch({
        actionType: 'save-answer',
        answer: selectedRows,
      });
  };

  shouldComponentUpdate(nextProps, nextState) {
    console.log("this.props.colorRows: " + this.props.colorRows);
    return true;
  }

  /*postAnswer(event) {*/
  postAnswer = (param) => (e) => {
    let apigClient = apigClientFactory.newClient();
    var that = this;
    var answer = this.props.answers[this.state.selected[0]];
    answer = param;
    /*console.log(UserStore.idToken);
    console.log('Parameter', param);
    console.log('Event', e);
    console.log("answer: " + answer);*/
    if (UserStore.idToken) {
      var additionalParams = {
        headers: {
          Authorization: UserStore.idToken,
        }
      };
      apigClient.questionsQuestionIdUserPost({question_id: this.props.questionId}, {answer: answer}, additionalParams).then(function (result) {
        that.setState({
          selectedAnswer: answer,
          correctAnswer: result.data.correct_answer,
          isCorrect: result.data.is_correct,
          selected: [-1]
        });
        console.log(result)
        // get user data -- added this apig call to update results after question is answered
            apigClient.userGet({}, null, additionalParams).then( function(user_result){
              console.log(user_result);
              TriviaDispatcher.dispatch({
                actionType: 'update-user',
                username: UserStore.username,
                idToken: UserStore.idToken,
                totalCorrect: user_result.data.total_correct,
                totalAnswered: user_result.data.total_answered
              });
            }).catch( function(result) {
              console.log(result)
              // Add error callback code here.
            });
        // end get user data
      }).catch(function (result) {
        console.log(result)
        // Add error callback code here.
      });

    } else {
      apigClient.questionsQuestionIdPost({question_id: this.props.questionId}, {answer: answer}).then(function (result) {
        that.setState({
          selectedAnswer: answer,
          correctAnswer: result.data.correct_answer,
          isCorrect: result.data.is_correct,
          selected: [-1]
        });
        console.log(result)
      }).catch(function (result) {
        console.log(result)
        // Add error callback code here.
      });
    }
  }

  /*nextQuestion() {*/
  nextQuestion  = () => (e) => {
    TriviaDispatcher.dispatch({
      actionType: 'change-question',
      questionId: +this.props.questionId + +1,
    });
    this.setState({
      selected: [-1],
      correctAnswer: null,
      selectedAnswer: null,
      isCorrect: null
    });

  }

  // this was for testing
  handleClick = (param) => (e) => {
    console.log('Event', e);
    console.log('Parameter', param);
  }

  render() {
    var that = this;
    return (
      <div>
        <Table className={this.state.colorRows} onRowSelection={this.handleRowSelection}>
          <TableBody>
            {this.props.answers.map(function(answer, index) {
              return (
                  that.getTableRow(answer, index)
              );
            })}
          </TableBody>
        </Table>
        <RaisedButton
          label='Submit'
          disabled={this.state.selected[0] === -1}
          primary={true}
          /*onTouchTap={this.postAnswer.bind(this)}*/
          /*onClick={this.handleClick(this.props.answers[CurrentAnswerStore.answerLoc])}*/
          onClick={this.postAnswer(this.props.answers[CurrentAnswerStore.answerLoc])}
        />
        <RaisedButton
          label='Next Question'
          disabled={this.state.correctAnswer === null}
          secondary={true}
          /*onTouchTap={this.nextQuestion.bind(this)}*/
          onClick={this.nextQuestion(this)}
        />
      </div>
    );
  }

  getTableRow(answer, index) {
    if (this.state.isCorrect && this.state.selectedAnswer === answer) {
      return (
        <TableRow selected={this.isSelected(index)} key={index} style={{backgroundColor:'#79d279'}}> // this.state.colorRows
          <TableRowColumn>{answer}</TableRowColumn>
        </TableRow>
      );
    } else if (!this.state.isCorrect && this.state.selectedAnswer === answer) {
      return (
        <TableRow selected={this.isSelected(index)} key={index} style={{backgroundColor:'#ff4d4d'}}>
          <TableRowColumn>{answer}</TableRowColumn>
        </TableRow>
      );
    } else if (!this.state.isCorrect && this.state.correctAnswer === answer) {
      return (
        <TableRow selected={this.isSelected(index)} key={index} style={{backgroundColor:'#79d279'}}>
          <TableRowColumn>{answer}</TableRowColumn>
        </TableRow>
      );
    } else {
      return (
        <TableRow selected={this.isSelected(index)} key={index}>
          <TableRowColumn>{answer}</TableRowColumn>
        </TableRow>
      );
    }
  }
}

export default App