import React from "react";
import axios from "axios";

import {
  DatePicker, Calendar, Card, Typography, Divider, Popconfirm, Modal,
  Descriptions, message, Button, Form, Select, Input, TimePicker, Tabs,
  Statistic, notification, Spin, Empty, Collapse, Space, Tooltip, Layout,
  InputNumber
  } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined, LoadingOutlined, ArrowRightOutlined, TagTwoTone, FileExcelTwoTone, CalendarTwoTone } from '@ant-design/icons';
import 'antd/dist/antd.css';
import './App.css';

import moment from 'moment';

import 'moment/locale/ru';
moment.locale('ru');

const { Panel } = Collapse;
const { Title } = Typography;
const { TextArea } = Input;
const { Option, OptGroup } = Select;
const { TabPane } = Tabs;
const { Sider, Content } = Layout;

class Application extends React.Component {

  constructor() {
    super();
    this.state = {
      loading: false,
      date: moment(),
      selectedDate: moment(),
      isAdmin: null,
      activeTab: "Big",
      loggedUser: 'Помощник',
      userRole: "Пользователь",
      records: null,
    };
  }

  tabChange = activeKey =>{
    this.setState({
      activeTab: activeKey
    });
  }

  onSelect = value => {
    this.setState({
      date: value,
      selectedDate: value,
    });
  }

  onSelectBig = value => {
    this.setState({
      date: value,
      selectedDate: value,
    });
  }

  onPanelChange = value => {
    this.setState({ date: value });
  }

  disabledDate = current => {
    return current && current < moment().add(-5, 'years') || moment(current).day() === 0 || moment(current).day() === 6
  }

  vksNotices = (value) => {
     let date = value.format('DD-MM-YYYY');
     let textDecoration;
     let color;
     if (value.day() === 0 || value.day() === 6)
      return (
        <div style={{width: '100%', fontSize: 50, textAlign: 'center'}}>
          <Tooltip title="Выходной день">
            <CalendarTwoTone twoToneColor="#ff6666" style={{opacity: 0.2}}/>
          </Tooltip>
        </div>
      )
     if (value.isBefore(moment().startOf('day'))) {textDecoration = 'underline red'; color = 'red'}
     else if(value.isBefore(moment().endOf('day'))) {textDecoration = 'underline orange'; color = 'orange'}
     else { textDecoration = 'underline green'; color = 'green' }
     if (!this.state.records) return <Spin tip="Загрузка..." size="large" indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}/>
     let records = this.state.records.filter(rec => {return rec.date === date});
     if (!records || records.length === 0)
        return (
          <div style={{width: '100%', fontSize: 48, textAlign: 'center'}}>
            <Tooltip title="На этот день нет заседаний">
              <FileExcelTwoTone twoToneColor="#f5f5f5"/>
            </Tooltip>
          </div>
        )
     return (
       <div style={{fontSize: 14}}>
          <Button style={{fontSize: 12}} size='small' onClick={() => this.setState({activeTab: "Small"})}>
              Подробнее<ArrowRightOutlined/>
          </Button>
            {records.map(record =>
                  <p style={{marginTop: 0.2, marginBottom: 0, textDecoration: textDecoration}}>
                    <TagTwoTone twoToneColor={color}/>{record.caseNumber}, {record.judgeName}
                  </p>
            )}
       </div>
     )
  }

  componentDidMount() {
    this.setState({
      isAdmin: this.props.isAdmin,
      loggedUser: this.props.username,
      userRole: this.props.role,
    })
    axios.get("http://backend-address:port/records")
       .then(response => this.setState({records: response.data}))
       .catch(error => notification.error({placement: 'top', message: error.message}))
  }

  render() {
    const {date, selectedDate} = this.state;
    const activeTab = this.state.activeTab;
    console.log('selectedDate', selectedDate);
    return (
          <div style={{display: 'block', background: 'white'}}>
            <Tabs
              activeKey={activeTab}
              onChange={this.tabChange}
              size='large'
              centered
              animated
            >
              <TabPane key="Big" tab="Обзорный календарь">
                <Calendar
                  mode="month"
                  value={date}
                  onSelect={this.onSelectBig}
                  onPanelChange={this.onPanelChange}
                  dateCellRender={this.vksNotices}
                  disabledDate={this.disabledDate}
                  style={{
                    border: '1px solid #A9A9A9',
                    borderRadius: 5,
                    padding: 20,
                    marginTop: 10,
                    marginBottom: 75,
                    marginLeft: 20,
                    marginRight: 20
                  }}
                />
              </TabPane>
              <TabPane tab='Подробное расписание на день' key='Small'>
               <Layout>
                <Sider style={{'backgroundColor': 'white'}} width={400}>
                <div style={{float: 'left', height: '100%'}}>
                  <Calendar
                    value={date}
                    onSelect={this.onSelect}
                    onPanelChange={this.onPanelChange}
                    fullscreen={false}
                    disabledDate={this.disabledDate}
                    style={{
                      width: '330px',
                      border: '1px solid #A9A9A9',
                      borderRadius: 5,
                      padding: 20,
                      marginTop: 20,
                      marginBottom: 10,
                      marginLeft: 20,
                      marginRight: 20,
                    }}
                  />
                </div>
                </Sider>
                <Content style={{'backgroundColor': 'white'}}>
                <div style={{float: 'left', marginTop: 10, marginLeft: 5, marginRight: 20, width: '90%'}}>
                  <Title level={4}>Расписание на выбранную дату: {selectedDate && selectedDate.format('DD-MM-YYYY')}</Title>
                  <VKSTable isAdmin={this.state.isAdmin} selectedDate={selectedDate.format('DD-MM-YYYY')} loggedUser={this.state.loggedUser}/>
                </div>
                </Content>
               </Layout>
              </TabPane>
            </Tabs>
          </div>
    );
  }
}

class VKSTable extends React.Component {

  constructor() {
    super();
    this.state = {
      loading: false,
      editFormVisible: false,
      addFormVisible: false,
      currentRecord:  {
        _id: 0,
        caseNumber: '',
        additions: '',
        courtName: '',
        room: null,
        time: null,
        date: null,
        typeVKS: 'Судебное заседание',
        judgeName: '',
        input: "Помощник",
      },
      todayRecords: [],
      actualDate: null,
      update: true,
    };
  }

  getActualData = (date) => {
    axios.get("http://backend-adress:port/records/"+ date)
      .then(response => { this.setState({todayRecords: response.data})})
      .catch(error => notification.error({placement: 'top', message: error.response.data.message}))
  }

  componentDidMount() {
    this.setState({actualDate: this.props.selectedDate});
    this.getActualData(this.props.selectedDate);
  }

  componentDidUpdate() {
    if (this.state.actualDate !== this.props.selectedDate) {
      this.setState({actualDate: this.props.selectedDate})
      this.getActualData(this.props.selectedDate);
    }
  }

  recordActions = (id, enable) => {
    let actions;
    if (enable)
     {
       actions = [
         <Button ghost
           type='text'
           style={{color: '#ffa500'}}
           onClick={() => {this.showEditForm(id)}}
         >
           <EditOutlined />Редактировать
         </Button>,
         <Popconfirm
           title="Вы уверены, что хотите удалить данную запись?"
           okText="Да"
           cancelText='Нет'
           onConfirm={()=> {this.confirmDelete(id)}}
         >
           <Button danger ghost type='text'>
             <DeleteOutlined /> Удалить
           </Button>
         </Popconfirm>
       ]
     }
    else actions = []
    return actions
  }

  confirmDelete = (id) => {
    axios.delete("http://backend-adress:port/records/delete/" + id)
      .then(response => {
        message.success('Запись удалена')
        this.getActualData(this.props.selectedDate);
      })
      .catch(error => notification.error({placement: 'top', duration: 0, message: error.response.data.message}))
  }

  showEditForm = (id) => {
    const foundRecord = this.state.todayRecords.find(({ _id }) => _id === id);
    this.setState({ editFormVisible: true, currentRecord: foundRecord});
  }

  showAddForm = () => {
    this.setState({ addFormVisible: true })
  }

  hideForm = () => {
    this.setState({ addFormVisible: false, editFormVisible: false });
  }

  getData = () => {
    this.getActualData(this.props.selectedDate);
  }

  sortByTime = (list) => {
      let sorted;
      sorted = list.reduce((times, item) => {
        const time = (times[item.time] || []);
        time.push(item);
        times[item.time]= time;
        return times;
      }, {});
      return sorted
  }

  objectToArray = (obj) => {
    let arr = [];
    for (var key in obj) {
      let minObj = {};
      minObj.strTime = key;
      minObj.list = obj[key];
      arr.push(minObj);
    }
    return arr;
  }

  render() {
    const isAdmin = this.props.isAdmin;
    const todayRecords = this.state.todayRecords;
    const currentRecord = this.state.currentRecord;
    const disabled = moment(this.props.selectedDate, 'DD-MM-YYYY', false).isBefore(moment().startOf('day'));
    let warn;
    if (disabled) warn = 'Вы не можете добавить заседание на прошедший день'
    const addButton =
        <Tooltip title={warn}>
          <Button type='dashed' onClick={this.showAddForm} size="large" style={{width: "100%"}} disabled={disabled}>
              <PlusOutlined />Добавить заседание
          </Button>
        </Tooltip>
    if (todayRecords.length === 0) {
      return <div>
                <Empty description="Нет заседаний на этот день" style={{paddingTop: 50, paddingBottom: 15, fontSize: 22}} />
                  {addButton}
                  <VKSForm
                    title="Добавить новую запись"
                    visible={this.state.addFormVisible}
                    onCancel={this.hideForm}
                    isUpdate={false}
                    loggedUser={this.props.loggedUser}
                    callback={this.onFormFinish}
                    updateData={this.getData}
                  />
             </div>
    }
    let groupedByTime;
    groupedByTime = this.sortByTime(todayRecords);
    groupedByTime = this.objectToArray(groupedByTime);
    groupedByTime.sort((prev, next) => {
      if (prev.strTime < next.strTime) return -1;
      if (prev.strTime > next.strTime) return 1;
      return 0;
    });
    return (
      <div>
        {addButton}
        <Collapse bordered={false} style={{marginBottom: 100, marginTop: 15, background: '#f7f7f7'}}>
          {groupedByTime.map((item) =>
            <Panel header={item.strTime}>
              <Space direction='horizontal' wrap={true}>
                {item.list.map((rec) =>
                  <Card
                    hoverable
                    actions={this.recordActions(rec._id, isAdmin)}
                  >
                    <Divider plain style={{fontSize: 16}}>{rec.judgeName}</Divider>
                    <Divider plain>{rec.caseNumber}</Divider>
                    <Descriptions column={1} style={{width: '300px'}}>
                      <Descriptions.Item label="Тип">{rec.typeVKS}</Descriptions.Item>
                      <Descriptions.Item label="Длительность">{rec.length} мин.</Descriptions.Item>
                      <Descriptions.Item label="Суд">{rec.courtName}</Descriptions.Item>
                      <Descriptions.Item label="Судья ">{rec.judgeName}</Descriptions.Item>
                      <Descriptions.Item label="Номер дела">{rec.caseNumber}</Descriptions.Item>
                      <Descriptions.Item label="Зал">{rec.room}</Descriptions.Item>
                      <Descriptions.Item label="Внес запись">{rec.input}</Descriptions.Item>
                      <Descriptions.Item label="Примечания">{rec.additions}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                )}
              </Space>
            </Panel>
          )}
       </Collapse>
       <VKSForm
          title="Отредактировать запись"
          visible={this.state.editFormVisible}
          onCancel={this.hideForm}
          isUpdate={this.state.update}
          record={currentRecord}
          callback={this.onFormFinish}
          updateData={this.getData}
        />
        <VKSForm
          title="Добавить новую запись"
          visible={this.state.addFormVisible}
          onCancel={this.hideForm}
          isUpdate={false}
          loggedUser={this.props.loggedUser}
          updateData={this.getData}
        />
      </div>
    );
  }
}

class VKSForm extends React.Component {

    formRef = React.createRef();

    static defaultProps = {
      record: {
        _id: 0,
        caseNumber: '',
        length: 30,
        additions: '',
        courtName: '',
        room: null,
        time: null,
        date: null,
        typeVKS: 'Судебное заседание',
        judgeName: '',
        input: "Помощник",
      }
    }

    constructor(){
      super();
      this.state = {
        courts: [],
        judges: [],
        selectedDate: null,
        record: null,
        rooms: null,
        checkRes: null,
      }
    }

    checkAvailableJudges = (checkData) => {
      axios.post("http://backend-address:port/checkJudges", checkData)
        .then(response => {return response.data})
        .catch(error => {
          notification.error({placement: 'top', message: error.message});
          this.setState({checkRes: error.repsonse.data})
        })
    }

    onFinish = async (values) => {
      let checkingData = {
        judgeName: values.judgeName,
        time: values.time.format('HH:mm'),
        date: values.date.format('DD-MM-YYYY'),
        length: values.length,
        room: values.room,
        id: this.props.record._id,
      }
      try {
        let checkRooms = await axios.post("http://backend-adress:port/checkRooms", checkingData);
        if (!checkRooms.data.check) {
          notification.error({placement: 'top', message: checkRooms.data.message})
          return
        }
      }
      catch (error) {
        notification.error({placement: 'top', message: error.message})
        return
      }
      try {
        let checkJudges = await axios.post("http://backend-adress:port/checkJudges", checkingData);
        if (!checkJudges.data.check) {
          notification.error({placement: 'top', message: checkJudges.data.message})
          return
        }
      }
      catch (error) {
        notification.error({placement: 'top', message: error.message})
        return
      }
      let inputData = {
        caseNumber: values.caseNumber,
        additions: values.additions,
        courtName: values.courtName,
        room: values.room,
        time: values.time.format('HH:mm'),
        date: values.date.format('DD-MM-YYYY'),
        typeVKS: values.typeVKS,
        judgeName: values.judgeName,
        length: values.length
      }
      if (this.props.isUpdate)
      {
        const id = this.props.record._id;
        axios.put("http://backend-adress:port/record/update/"+ id, inputData)
          .then(response => message.success('Запись успешно обновлена!'))
          .catch(error => notification.error({placement: 'top', message: error.message}))
        this.props.onCancel();
        this.props.updateData();
      }
      else {
        inputData.input = this.props.loggedUser;
        axios.post("http://backend-adress:port/records/insert", inputData)
          .then(response => message.success('Запись успешно добавлена!'))
          .catch(error => notification.error({placement: 'top', message: error.message}))
        this.formRef.current.resetFields();
        this.props.onCancel();
        this.props.updateData();
      }
    }

    onCancel = () => {
      this.props.onCancel();
    }

    disabledDate = current => {
      return current && current < moment().add(-1, 'days').endOf('day') || moment(current).day() === 0 || moment(current).day() === 6
    }

    getDisabledHours = () => {
      var hours = [];
      for(var i=0; i<8; i++) { hours.push(i); }
      for(var i=18; i<24; i++) { hours.push(i); }
      return hours;
    }

    componentDidMount() {
      axios
        .get("http://backend-adress:port/courts")
        .then(response => {
            this.setState({courts: response.data});
          })
        .catch(error => {
          notification.error({placement: 'top',  duration: 0, message: error.message});
        });
      axios
        .get("http://backend-adress:port/judges")
        .then(response => {
            this.setState({judges: response.data});
          })
        .catch(error => {
          notification.error({placement: 'top', duration: 0, message: error.message});
        });
      axios
        .get("http://backend-adress:port/rooms")
        .then(response => {
            this.setState({rooms: response.data});
          })
        .catch(error => {
          notification.error({placement: 'top', duration: 0, message: error.message});
        });
    }

    render() {
      const record = this.props.record;
      console.log('record', record)
      if (!record) return
      let buttonDescr;
      let recordDate;
      let recordTime;
      if (this.props.isUpdate) {
        buttonDescr = 'Изменить запись';
        if (record.date && record.time) {
          recordDate = moment(record.date, 'DD/MM/YYYY', false);
          recordTime = moment(record.time, 'HH:mm A');
        }
      }
      else {
        buttonDescr = 'Создать запись';
      }
      const {judges, courts, rooms} = this.state;
      if (!judges || !courts || !record || !rooms)
          return <Modal visible={this.props.visible} footer={null} onCancel={this.onCancel} destroyOnClose>
                    <Spin tip="Загрузка параметров..." size="large" indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}/>
                 </Modal>
      judges.sort((a, b) => {
          if (a.judgeName < b.judgeName) return -1;
          if (b.judgeName > a.judgeName) return 1;
          return 0;
        }
      );
      rooms.sort((a, b) => {
        if (a.room < b.room) return -1;
        if (b.room > a.room) return 1;
        return 0;
      });
      const judgesList = judges.map((judge) => <Option value={judge.judgeName}/>);
      const roomsList = rooms.map((room) => <Option value={room.room}> Зал {room.room} </Option>);

      const courtsList = courts.map((courtsGroup) =>
            <OptGroup label={courtsGroup.type}>
                {courtsGroup.names.map((singleCourt) => <Option value={singleCourt}/>)}
            </OptGroup>
      );
      return (
        <Modal
          title={this.props.title}
          visible={this.props.visible}
          centered
          onCancel={this.onCancel}
          footer={null}
          destroyOnClose
        >
          <Form
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            onFinish={this.onFinish}
            ref={this.formRef}
          >
            <Form.Item
              label='Тип заседания'
              name='typeVKS'
              rules={[{required: true, message: 'Выберите тип заседания!'}]}
              initialValue={record.typeVKS}
            >
              <Select
                style={{width: 180}}
              >
                <Option value='Судебное заседание'>Судебное заседание</Option>
                <Option value='Судебное поручение'>Судебное поручение</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Судья"
              name="judgeName"
              rules={[{ required: true, message: 'Выберите судью!' }]}
              initialValue={record.judgeName}
            >
              <Select style={{ width: 200 }} showSearch>
                {judgesList}
              </Select>
            </Form.Item>
            <Form.Item
              label="Длительность(мин)"
              name="length"
              rules={[{ required: true, message: 'Выберите длительность!' }]}
              initialValue={record.length}
            >
              <InputNumber min={10} max={120}/>
            </Form.Item>
            <Form.Item
              label="Дата"
              name='date'
              rules={[{ required: true, message: 'Выберите дату заседания!' }]}
              initialValue={recordDate}
            >
              <DatePicker
                format='DD-MM-YYYY'
                placeholder='Дата заседания'
                style={{width: '150px'}}
                disabledDate={this.disabledDate}
              />
            </Form.Item>
            <Form.Item
              label="Время"
              name='time'
              rules={[{ required: true, message: 'Выберите время заседания!' }]}
              initialValue={recordTime}
            >
              <TimePicker format='HH:mm'
                  placeholder='Время заседания'
                  style={{width: '150px'}}
                  minuteStep={10}
                  disabledHours={this.getDisabledHours}
              />
            </Form.Item>
            <Form.Item
              label="Зал"
              name="room"
              rules={[{ required: true, message: 'Выберите зал, в котором будет ВКС!' }]}
              initialValue={record.room}
            >
              <Select style={{ width: 100 }}>
                {roomsList}
              </Select>
            </Form.Item>
            <Form.Item
                label="Суд"
                name="courtName"
                rules={[{ required: true, message: 'Выберите суд!' }]}
                initialValue={record.courtName}
              >
                <Select style={{ width: 300 }} showSearch>
                  {courtsList}
              </Select>
            </Form.Item>
            <Form.Item
                label="Номер дела"
                name="caseNumber"
                rules={[{ required: true, message: 'Введите номер дела!' }]}
                wrapperCol={{ span: 7 }}
                initialValue={record.caseNumber}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Примечания"
              name="additions"
              initialValue={record.additions}
            >
              <TextArea
                 allowClear
                 showCount
                 maxLength={100}
                 autoSize={{ minRows: 3, maxRows: 5 }}
              />
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
              <Button type="primary" htmlType="submit">
                {buttonDescr}
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      )
    }
}

export default Application;
