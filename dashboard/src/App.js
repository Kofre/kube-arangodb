import React, { Component } from 'react';
import ReactTimeout from 'react-timeout';
import DeploymentOperator from './deployment/DeploymentOperator.js';
import StorageOperator from './storage/StorageOperator.js';
import NoOperator from './NoOperator.js';
import Loading from './util/Loading.js';
import api, { isUnauthorized } from './api/api.js';
import { Container, Segment, Message } from 'semantic-ui-react';
import { withAuth } from './auth/Auth.js';

const PodInfoView = ({pod, namespace}) => (
  <Segment basic>
    <Message>
      <Message.Header>Kube-ArangoDB</Message.Header>
      <p>Running in Pod <b>{pod}</b> in namespace <b>{namespace}</b>.</p>
    </Message>
  </Segment>
);

const OperatorsView = ({error, deployment, storage, pod, namespace}) => {
  let Operator = NoOperator;
  if (deployment)
    Operator = DeploymentOperator;
  else if (storage)
    Operator = StorageOperator;
  return (
    <Operator
      podInfoView={<PodInfoView pod={pod} namespace={namespace} />}
      error={error}
    />
  );
}

const LoadingView = () => (
  <Container>
    <Loading/>
  </Container>
);

class App extends Component {
  state = {
    operators: undefined,
    error: undefined
  };

  componentDidMount() {
    this.reloadOperators();
  }

  reloadOperators = async() => {
    try {
      const operators = await api.get('/api/operators');
      this.setState({
        operators,
        error: undefined
      });
    } catch (e) {
      this.setState({
        error: e.message
      });
      if (isUnauthorized(e)) {
        this.props.doLogout();
      }
    }
    this.props.setTimeout(this.reloadOperators, 10000);
  }

  render() {
    if (this.state.operators) {
      return <OperatorsView
        error={this.state.error}
        deployment={this.state.operators.deployment}
        storage={this.state.operators.storage}
        pod={this.state.operators.pod}
        namespace={this.state.operators.namespace}
        />;
    }
    return (<LoadingView/>);
  }
}

export default ReactTimeout(withAuth(App));
