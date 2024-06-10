import React from "react";
import { Button, Form, InputNumber, notification, Tooltip, Popconfirm, Table, Typography, Popover, Space, message } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined} from '@ant-design/icons';
import 'antd/dist/antd.css';
import './../App.css';
import axios from "axios";

const { Title } = Typography;
const { Column, ColumnGroup } = Table;

class RoomsTable extends React.Component {

    formRef = React.createRef();
    constructor() {
      super();
      this.state = {
        rooms: [],
        visibility: false,
      }
    }

    onFinish = (values) => {
      let inputData = {
        room: values.room
      }
      axios.post("http://backend-address:port/rooms/insert", inputData)
        .then(response => {
            message.success('Запись успешно добавлена!');
            this.getActualData();
            this.formRef.current.resetFields();
          })
        .catch(error => notification.error({placement: 'top', message: error.message}))
      this.getActualData();
    }

    rForm = () => {
      return (
        <>
          <Form
            onFinish={this.onFinish}
            ref={this.formRef}
          >
            <Form.Item
              label='Номер зала'
              name='room'
              rules={[{required: true, message: 'Введите корректный номер кабинета!'}]}
            >
              <InputNumber min={100} max={600}/>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">Добавить запись</Button>
            </Form.Item>
          </Form>
        </>
      )
    }

    confirmDeleteRoom = (id) => {
      axios.delete("http://backend-address:port/rooms/delete/" + id)
        .then(response => message.success('Запись удалена'))
        .catch(error => notification.error({placement: 'top', duration: 0, message: error.response.data.message}))
      this.getActualData();
    }

    getActualData = () => {
      axios
        .get("http://backend-address:port/rooms")
        .then(response => {
            this.setState({rooms: response.data});
          })
        .catch(error => {
          notification.error({placement: 'top', duration: 0, message: error.message});
        });
    }

    tableFooter = () => {
      return (
        <>
          <Popover
            title='Новый зал'
            trigger='click'
            visibility={this.state.visibility}
            onVisibleChange={(visible) => {
                this.setState({visibility: visible})
                this.formRef.current.resetFields();
              }}
            content={this.rForm}
          >
            <Button type='primary'>
              <PlusOutlined /> Добавить запись
            </Button>
          </Popover>
        </>
      )
    }

    componentDidMount() {
      axios
        .get("http://backend-address:port/rooms")
        .then(response => {
            this.setState({rooms: response.data});
          })
        .catch(error => {
          notification.error({placement: 'top', duration: 0, message: error.message});
        });
    }

    render() {
      return(
        <>
        <Table
          bordered
          dataSource={this.state.rooms}
          title={() => <Title level={4}>Список залов</Title>}
          footer={this.tableFooter}
          style={{marginLeft: 30, marginRight: 30, marginBottom: 30}}
          pagination={{position: ['none', 'bottomCenter'], pageSize: 10}}
        >
          <Column title="ID зала" dataIndex="_id" key="id" />
          <Column
            title="Номер зала"
            dataIndex="room"
            key='room'
            sorter={(a, b) => {
              if (a.room < b.room) return -1;
              if (b.room > a.room) return 1;
              return 0;
            }}
            sortOrder='ascend'
          />
          <Column
            title='Действия'
            key='action'
            render={(text, rec) => (
              <Popconfirm
                title="Вы уверены, что хотите удалить данную запись?"
                okText="Да"
                cancelText='Нет'
                onConfirm={()=> {this.confirmDeleteRoom(rec._id)}}
              >
                <Button danger type='text'>
                  <DeleteOutlined /> Удалить
                </Button>
              </Popconfirm>
             )
            }
          />
        </Table>
        </>
      )
    }
  }

export default RoomsTable;
