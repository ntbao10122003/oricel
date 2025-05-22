import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import AdminDashboard from './components/AdminDashboard';
import ClientHome from './components/ClientHome';

const { Header, Content, Sider } = Layout;

function App() {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider>
          <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
            <Menu.Item key="1">
              <Link to="/admin">Admin Dashboard</Link>
            </Menu.Item>
            <Menu.Item key="2">
              <Link to="/">Trang chủ</Link>
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout>
          <Header style={{ background: '#fff' }} />
          <Content style={{ margin: '16px' }}>
            <Routes>
              <Route path="/admin/*" element={<AdminDashboard />} />
              <Route path="/" element={<ClientHome />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
}
export default App;